const Topic = require('../models/taxonomy/Topic');
const Chapter = require('../models/taxonomy/Chapter');
const Subject = require('../models/taxonomy/Subject');
const Lecture = require('../models/taxonomy/Lecture');

/**
 * Ensure lecture_subjects and lecture_streams reflect the topic's parent subject
 * plus any explicitly selected subjects/streams from admin.
 */
async function syncLectureExamPrepTags(lectureId, topicId, explicitSubjectIds = [], explicitStreamIds = []) {
  const topic = await Topic.findById(topicId);
  if (!topic) return;

  const subjectIds = new Set(
    (explicitSubjectIds || []).map((x) => parseInt(x, 10)).filter((n) => !Number.isNaN(n) && n > 0)
  );
  if (topic.chapter_id) {
    const chapter = await Chapter.findById(topic.chapter_id);
    if (chapter?.sub_id) {
      subjectIds.add(Number(chapter.sub_id));
    }
  } else if (topic.sub_id) {
    subjectIds.add(Number(topic.sub_id));
  }

  const streamIds = new Set(
    (explicitStreamIds || []).map((x) => parseInt(x, 10)).filter((n) => !Number.isNaN(n) && n > 0)
  );

  for (const sid of subjectIds) {
    const subj = await Subject.findById(sid);
    if (!subj?.streams) continue;
    const streams = Subject.parseJsonbArray(subj.streams);
    for (const x of streams) {
      const n = typeof x === 'number' ? x : parseInt(String(x), 10);
      if (!Number.isNaN(n) && n > 0) streamIds.add(n);
    }
  }

  await Lecture.setSubjects(lectureId, [...subjectIds]);
  await Lecture.setStreams(lectureId, [...streamIds]);
}

module.exports = {
  syncLectureExamPrepTags,
};
