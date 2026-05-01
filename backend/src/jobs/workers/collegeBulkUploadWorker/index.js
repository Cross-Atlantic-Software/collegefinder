const fs = require('fs');
const XLSX = require('xlsx');
const UploadJob = require('../../../models/UploadJob');
const { processCollegeBulkRow } = require('../../../services/collegeBulkRowProcessor');

const CHUNK_YIELD_EVERY = parseInt(process.env.COLLEGE_BULK_CHUNK_YIELD || process.env.LECTURE_BULK_CHUNK_YIELD || '500', 10);

function normSheetName(n) {
  return String(n).toLowerCase().replace(/\s+/g, '');
}

/**
 * Map lower(college_name) -> first Excel row number (1-based sheet row, +1 for header)
 * for the **entire** sheet. Only the first row for each name is allowed to create a college;
 * other rows with the same name are rejected with a message pointing at the first row.
 */
function buildFirstOccurrenceExcelRowByName(dataRows) {
  const map = new Map();
  for (let i = 0; i < dataRows.length; i++) {
    const name = (dataRows[i].college_name ?? dataRows[i].college_Name ?? '').toString().trim();
    if (!name) continue;
    const ln = name.toLowerCase();
    if (!map.has(ln)) {
      map.set(ln, i + 2);
    }
  }
  return map;
}

async function runCollegeBulkUploadJob(bullJob) {
  const uploadJobId = parseInt(bullJob?.data?.uploadJobId, 10);
  if (Number.isNaN(uploadJobId) || uploadJobId <= 0) {
    throw new Error('Invalid uploadJobId');
  }

  const job = await UploadJob.findById(uploadJobId);
  if (!job) {
    throw new Error(`Upload job ${uploadJobId} not found`);
  }
  if (job.module !== 'colleges') {
    throw new Error('Not a colleges bulk job');
  }
  if (job.status === 'completed') {
    console.log(`[college-bulk] job ${uploadJobId} already completed, skipping`);
    return { uploadJobId, skipped: true };
  }
  if (job.status === 'failed' && job.error_message) {
    console.log(`[college-bulk] job ${uploadJobId} already failed, skipping`);
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

  const workbook = XLSX.read(fs.readFileSync(job.file_path), { type: 'buffer', raw: true });
  const collegesSheetName =
    workbook.SheetNames.find((n) => normSheetName(n) === 'colleges') || workbook.SheetNames[0];
  const sheet = workbook.Sheets[collegesSheetName];
  if (!sheet) {
    await UploadJob.update(uploadJobId, {
      status: 'failed',
      error_message: 'Excel has no valid sheet for colleges.',
    });
    throw new Error('No colleges sheet');
  }

  const dataRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  const startIndex = Math.min(job.cursor_row || 0, dataRows.length);
  const firstOccurrenceExcelRowByLowerName = buildFirstOccurrenceExcelRowByName(dataRows);
  const uniqueCollegeNames = firstOccurrenceExcelRowByLowerName.size;
  if (uniqueCollegeNames < dataRows.length) {
    console.log(
      `[college-bulk] job ${uploadJobId}: ${dataRows.length} data rows but only ${uniqueCollegeNames} unique college_name values — ${dataRows.length - uniqueCollegeNames} rows will fail as duplicates of an earlier row`
    );
  }

  console.log(`[college-bulk] job ${uploadJobId}: rows=${dataRows.length}, resumeFrom=${startIndex}`);

  try {
    for (let i = startIndex; i < dataRows.length; i++) {
      if (i > startIndex && CHUNK_YIELD_EVERY > 0 && (i - startIndex) % CHUNK_YIELD_EVERY === 0) {
        await new Promise((r) => setImmediate(r));
      }

      const row = dataRows[i];
      const rowNum = i + 2;
      const name = (row.college_name ?? row.college_Name ?? '').toString().trim();
      if (!name) {
        await UploadJob.insertRowResult(uploadJobId, rowNum, 'failed', {}, 'college_name is required');
        await UploadJob.incrementCounters(uploadJobId, {
          processed_delta: 1,
          success_delta: 0,
          failed_delta: 1,
          hook_delta: 0,
        });
        continue;
      }
      const firstRowForName = firstOccurrenceExcelRowByLowerName.get(name.toLowerCase());
      if (firstRowForName !== undefined && firstRowForName !== rowNum) {
        const dupMsg = `Duplicate college_name "${name}" in this Excel file — first occurrence is row ${firstRowForName} (use one row per college; add multiple programs in program_names / related columns on that row).`;
        await UploadJob.insertRowResult(uploadJobId, rowNum, 'failed', {}, dupMsg);
        await UploadJob.incrementCounters(uploadJobId, {
          processed_delta: 1,
          success_delta: 0,
          failed_delta: 1,
          hook_delta: 0,
        });
        continue;
      }
      const result = await processCollegeBulkRow({ row, rowNum });

      if (result.ok) {
        await UploadJob.insertRowResult(uploadJobId, rowNum, 'success', { college_id: result.college.id }, null);
        await UploadJob.incrementCounters(uploadJobId, {
          processed_delta: 1,
          success_delta: 1,
          failed_delta: 0,
          hook_delta: 0,
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
    console.log(`✅ [college-bulk] job ${uploadJobId} completed`);

    try {
      if (fs.existsSync(job.file_path)) fs.unlinkSync(job.file_path);
    } catch (unlinkErr) {
      console.warn(`[college-bulk] cleanup files for job ${uploadJobId}:`, unlinkErr.message);
    }

    return { uploadJobId, done: true };
  } catch (err) {
    console.error(`❌ [college-bulk] job ${uploadJobId}:`, err);
    await UploadJob.update(uploadJobId, {
      status: 'failed',
      error_message: err.message || 'Worker error',
    });
    throw err;
  }
}

function startCollegeBulkUploadWorker() {
  const { Worker } = require('bullmq');
  const { getRedisConnection } = require('../../redisConnection');
  const { QUEUE_NAME } = require('../../queues/collegeBulkUploadQueue');

  const concurrency = parseInt(process.env.COLLEGE_BULK_WORKER_CONCURRENCY || '1', 10);

  const worker = new Worker(QUEUE_NAME, runCollegeBulkUploadJob, {
    connection: getRedisConnection(),
    concurrency,
    lockDuration: 7200000,
    stalledInterval: 120000,
    maxStalledCount: 2,
  });

  worker.on('completed', (job) => {
    console.log(`✅ [Worker] college bulk upload finished bullmq id=${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [Worker] college bulk upload failed (bullmq ${job?.id}):`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ [Worker] collegeBulkUploadWorker error:', err.message);
  });

  console.log(`🟢 collegeBulkUploadWorker started (concurrency=${concurrency})`);
  return worker;
}

module.exports = {
  startCollegeBulkUploadWorker,
  runCollegeBulkUploadJob,
};
