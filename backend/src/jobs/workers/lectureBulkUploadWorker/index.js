const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const UploadJob = require('../../../models/UploadJob');
const { processLectureBulkRow } = require('../../../services/lectureBulkRowProcessor');
const { parseLogosFromZip } = require('../../../utils/logoUploadUtils');

const CHUNK_YIELD_EVERY = parseInt(process.env.LECTURE_BULK_CHUNK_YIELD || '500', 10);

/**
 * Process all rows for a lecture bulk upload job (resumable via upload_jobs.cursor_row).
 */
async function runLectureBulkUploadJob(bullJob) {
  const uploadJobId = parseInt(bullJob?.data?.uploadJobId, 10);
  if (Number.isNaN(uploadJobId) || uploadJobId <= 0) {
    throw new Error('Invalid uploadJobId');
  }

  const job = await UploadJob.findById(uploadJobId);
  if (!job) {
    throw new Error(`Upload job ${uploadJobId} not found`);
  }
  if (job.status === 'completed') {
    console.log(`[lecture-bulk] job ${uploadJobId} already completed, skipping`);
    return { uploadJobId, skipped: true };
  }
  if (job.status === 'failed' && job.error_message) {
    console.log(`[lecture-bulk] job ${uploadJobId} already failed, skipping`);
    return { uploadJobId, skipped: true };
  }

  if (!fs.existsSync(job.file_path)) {
    await UploadJob.update(uploadJobId, {
      status: 'failed',
      error_message: 'Uploaded Excel file missing on disk (expired or moved)',
    });
    throw new Error('Excel file missing');
  }

  await UploadJob.update(uploadJobId, { status: 'processing', error_message: null });

  let thumbnailMap = new Map();
  if (job.thumbnails_zip_path && fs.existsSync(job.thumbnails_zip_path)) {
    try {
      thumbnailMap = parseLogosFromZip(fs.readFileSync(job.thumbnails_zip_path));
    } catch (zipErr) {
      console.error('[lecture-bulk] thumbnails ZIP parse:', zipErr.message);
    }
  }

  const workbook = XLSX.read(fs.readFileSync(job.file_path), { type: 'buffer', raw: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const dataRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

  const dupKey = new Set();
  const startIndex = Math.min(job.cursor_row || 0, dataRows.length);

  console.log(
    `[lecture-bulk] job ${uploadJobId}: rows=${dataRows.length}, resumeFrom=${startIndex}, zipThumbs=${thumbnailMap.size}`
  );

  try {
    for (let i = startIndex; i < dataRows.length; i++) {
      if (i > startIndex && CHUNK_YIELD_EVERY > 0 && (i - startIndex) % CHUNK_YIELD_EVERY === 0) {
        await new Promise((r) => setImmediate(r));
      }

      const row = dataRows[i];
      const rowNum = i + 2;
      const result = await processLectureBulkRow({ row, rowNum, thumbnailMap, dupKey });

      if (result.ok) {
        await UploadJob.insertRowResult(uploadJobId, rowNum, 'success', { lecture_id: result.lecture.id }, null);
        await UploadJob.incrementCounters(uploadJobId, {
          processed_delta: 1,
          success_delta: 1,
          failed_delta: 0,
          hook_delta: result.hookEnqueued ? 1 : 0,
        });
      } else {
        await UploadJob.insertRowResult(uploadJobId, rowNum, 'failed', {}, result.error);
        await UploadJob.incrementCounters(uploadJobId, {
          processed_delta: 1,
          success_delta: 0,
          failed_delta: 1,
          hook_delta: 0,
        });
      }
    }

    await UploadJob.update(uploadJobId, { status: 'completed' });
    console.log(`✅ [lecture-bulk] job ${uploadJobId} completed`);

    try {
      if (fs.existsSync(job.file_path)) fs.unlinkSync(job.file_path);
      if (job.thumbnails_zip_path && fs.existsSync(job.thumbnails_zip_path)) {
        fs.unlinkSync(job.thumbnails_zip_path);
      }
    } catch (unlinkErr) {
      console.warn(`[lecture-bulk] cleanup files for job ${uploadJobId}:`, unlinkErr.message);
    }

    return { uploadJobId, done: true };
  } catch (err) {
    console.error(`❌ [lecture-bulk] job ${uploadJobId}:`, err);
    await UploadJob.update(uploadJobId, {
      status: 'failed',
      error_message: err.message || 'Worker error',
    });
    throw err;
  }
}

function startLectureBulkUploadWorker() {
  const { Worker } = require('bullmq');
  const { getRedisConnection } = require('../../redisConnection');
  const { QUEUE_NAME } = require('../../queues/lectureBulkUploadQueue');

  const concurrency = parseInt(process.env.LECTURE_BULK_WORKER_CONCURRENCY || '1', 10);

  const worker = new Worker(QUEUE_NAME, runLectureBulkUploadJob, {
    connection: getRedisConnection(),
    concurrency,
    lockDuration: 7200000,
    stalledInterval: 120000,
    maxStalledCount: 2,
  });

  worker.on('completed', (job) => {
    console.log(`✅ [Worker] lecture bulk upload job finished bullmq id=${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [Worker] lecture bulk upload failed (bullmq ${job?.id}):`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ [Worker] lectureBulkUploadWorker error:', err.message);
  });

  console.log(`🟢 lectureBulkUploadWorker started (concurrency=${concurrency})`);
  return worker;
}

module.exports = {
  startLectureBulkUploadWorker,
  runLectureBulkUploadJob,
};
