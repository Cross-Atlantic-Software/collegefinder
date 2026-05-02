/**
 * Single-row lecture bulk import logic (reused by sync bulk upload and async job worker).
 */
const Topic = require('../models/taxonomy/Topic');
const Subtopic = require('../models/taxonomy/Subtopic');
const Subject = require('../models/taxonomy/Subject');
const Exam = require('../models/taxonomy/Exam');
const Lecture = require('../models/taxonomy/Lecture');
const { uploadToS3 } = require('../../utils/storage/s3Upload');
const { splitList, getCell } = require('../utils/bulkUploadUtils');
const {
  enrichDescriptionFromYoutubeIframe,
  enrichThumbnailFromYoutubeIframe,
  extractYouTubeVideoId,
} = require('../utils/youtubeMetadata');
const { enqueueLectureHookSummaryIfPending } = require('../jobs/queues/lectureHookSummaryQueue');

function toStoredYoutubeIframe(rawValue) {
  if (rawValue == null) return null;
  const input = String(rawValue).trim();
  if (!input) return null;
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return input;
  return `<iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

async function getLectureYoutubeMetaFromIframe(iframeCode) {
  if (!iframeCode || !String(iframeCode).trim()) return null;
  const apiKey =
    process.env.YOUTUBE_API_KEY ||
    process.env.GOOGLE_YOUTUBE_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  const videoId = extractYouTubeVideoId(String(iframeCode));
  if (!videoId) return null;
  try {
    const { fetchYouTubeLectureMetadata } = require('../utils/youtubeMetadata');
    return await fetchYouTubeLectureMetadata(videoId, apiKey);
  } catch (e) {
    console.error('getLectureYoutubeMetaFromIframe:', e.message || e);
    return null;
  }
}

/**
 * Process one Excel row for lecture bulk import.
 * @param {object} params
 * @param {object} params.row - sheet_to_json row
 * @param {number} params.rowNum - 1-based Excel row number (header = 1, first data = 2)
 * @param {Map<string, { buffer: Buffer, originalname: string }>} params.thumbnailMap
 * @param {Set<string>} params.dupKey - in-file duplicate key set (mutated)
 * @returns {Promise<{ ok: true, lecture: object, hookEnqueued: boolean } | { ok: false, error: string }>}
 */
async function processLectureBulkRow({ row, rowNum, thumbnailMap, dupKey }) {
  const topicName = getCell(row, 'topic_name', 'topic_Name');
  const subtopicName = getCell(row, 'subtopic_name', 'subtopic_Name');
  if (!topicName) {
    return { ok: false, error: 'topic_name is required' };
  }
  if (!subtopicName) {
    return { ok: false, error: 'subtopic_name is required' };
  }
  const topic = await Topic.findByName(topicName);
  if (!topic) {
    return { ok: false, error: `topic not found: "${topicName}"` };
  }
  const subtopic = await Subtopic.findByTopicIdAndNameInsensitive(topic.id, subtopicName);
  if (!subtopic) {
    return { ok: false, error: `subtopic not found under topic: "${subtopicName}"` };
  }

  const content_type = 'VIDEO';
  const status = true;
  const sort_order = 0;

  const keyTopicsCell = getCell(
    row,
    'key_topics_to_be_covered',
    'Key Topics To Be Covered',
    'key_Topics_To_Be_Covered'
  );
  const key_topics_to_be_covered =
    keyTopicsCell && String(keyTopicsCell).trim() ? String(keyTopicsCell).trim() : null;

  const subjectNames = getCell(row, 'subject_names', 'subject_Names');
  const examNames = getCell(row, 'exam_names', 'exam_Names');

  const linkRaw = getCell(
    row,
    'youtube_video_link',
    'youtube_Video_Link',
    'youtube_link',
    'youtube_Link',
    'youtube_url',
    'youtube_Url',
    'iframe_code',
    'iframe_Code',
    'video_file',
    'video_File'
  );

  if (!linkRaw || !String(linkRaw).trim()) {
    return {
      ok: false,
      error: 'youtube_video_link is required (YouTube watch/embed URL or a direct https video URL)',
    };
  }
  const linkTrimmed = String(linkRaw).trim();
  let video_file = null;
  let youtubeSource = null;
  if (extractYouTubeVideoId(linkTrimmed)) {
    youtubeSource = linkTrimmed;
  } else if (/^https?:\/\//i.test(linkTrimmed)) {
    video_file = linkTrimmed;
  } else {
    return { ok: false, error: 'youtube_video_link must be a valid http(s) URL' };
  }

  const thumbFn = getCell(row, 'thumbnail_filename', 'thumbnail_Filename') || null;

  let thumbnail = null;
  if (thumbFn && thumbnailMap && thumbnailMap.size > 0) {
    const tf = thumbnailMap.get(String(thumbFn).toLowerCase());
    if (tf?.buffer) {
      try {
        thumbnail = await uploadToS3(tf.buffer, tf.originalname || thumbFn, 'lecture_thumbnails');
      } catch (e) {
        return { ok: false, error: `thumbnail upload failed: ${e.message}` };
      }
    }
  }

  const iframeInput = youtubeSource;
  const iframeNorm =
    iframeInput && String(iframeInput).trim() ? toStoredYoutubeIframe(iframeInput) : null;

  const description = await enrichDescriptionFromYoutubeIframe(iframeNorm, null);
  const youtubeMeta = await getLectureYoutubeMetaFromIframe(iframeNorm);
  const youtubeTitle = youtubeMeta?.title ? String(youtubeMeta.title).trim() : '';
  if (youtubeTitle) {
    const key = `${subtopic.id}:${youtubeTitle.toLowerCase()}`;
    if (dupKey.has(key)) {
      return {
        ok: false,
        error: `duplicate youtube title "${youtubeTitle}" for this subtopic in file`,
      };
    }
    const existing = await Lecture.findByYoutubeTitleAndSubtopicId(youtubeTitle, subtopic.id);
    if (existing) {
      return {
        ok: false,
        error: `lecture "${youtubeTitle}" already exists for this subtopic`,
      };
    }
    dupKey.add(key);
  }

  let thumbnailFinal = thumbnail;
  if (!thumbnailFinal && iframeNorm) {
    thumbnailFinal = await enrichThumbnailFromYoutubeIframe(iframeNorm, null);
  }

  try {
    const lecture = await Lecture.create({
      topic_id: topic.id,
      subtopic_id: subtopic.id,
      content_type,
      video_file,
      iframe_code: iframeNorm,
      article_content: null,
      thumbnail: thumbnailFinal,
      thumbnail_filename: thumbFn ? String(thumbFn).trim() : null,
      status,
      description,
      key_topics_to_be_covered,
      sort_order: Number.isNaN(sort_order) ? 0 : sort_order,
      youtube_title: youtubeMeta?.title || null,
      youtube_channel_name: youtubeMeta?.channelName || null,
      youtube_channel_id: youtubeMeta?.channelId || null,
      youtube_channel_url: youtubeMeta?.channelUrl || null,
      youtube_like_count: youtubeMeta?.likeCount ?? null,
      youtube_subscriber_count: youtubeMeta?.subscriberCount ?? null,
    });

    const subjectIds = [];
    const subjectsResolved = [];
    for (const nm of splitList(subjectNames)) {
      const s = await Subject.findByName(nm);
      if (s) {
        subjectIds.push(s.id);
        subjectsResolved.push(s);
      }
    }
    const streamIdSet = new Set();
    for (const s of subjectsResolved) {
      const arr = Array.isArray(s.streams) ? s.streams : [];
      for (const sid of arr) {
        const n = typeof sid === 'number' ? sid : parseInt(String(sid), 10);
        if (!Number.isNaN(n) && n > 0) streamIdSet.add(n);
      }
    }
    const streamIds = [...streamIdSet];
    const examIds = [];
    for (const nm of splitList(examNames)) {
      const e = await Exam.findByName(nm);
      if (e) examIds.push(e.id);
    }
    if (streamIds.length) await Lecture.setStreams(lecture.id, streamIds);
    if (subjectIds.length) await Lecture.setSubjects(lecture.id, subjectIds);
    if (examIds.length) await Lecture.setExams(lecture.id, examIds);

    let hookEnqueued = false;
    try {
      const outcome = await enqueueLectureHookSummaryIfPending(lecture.id);
      hookEnqueued = outcome.kind === 'queued';
    } catch (hookErr) {
      console.warn(
        `[lectureBulkRowProcessor] Hook summary queue skipped for lecture ${lecture.id}:`,
        hookErr.message || hookErr
      );
    }

    return { ok: true, lecture, hookEnqueued };
  } catch (createErr) {
    return { ok: false, error: createErr.message || 'Failed to create row' };
  }
}

module.exports = {
  processLectureBulkRow,
};
