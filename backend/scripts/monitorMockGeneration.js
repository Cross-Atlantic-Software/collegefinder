/**
 * Monitor Mock Generation Jobs
 * 
 * This script shows the status of all mock generation jobs in the queue.
 * Useful for debugging and monitoring background generation.
 * 
 * Usage:
 *   node scripts/monitorMockGeneration.js
 */

require('dotenv').config();
const { Queue } = require('bullmq');

const QUEUE_NAME = 'mock-generation';

async function monitorJobs() {
  let connection;
  
  try {
    // Create Redis connection
    connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: null,
    };
    
    const queue = new Queue(QUEUE_NAME, { connection });
    
    console.log('🔍 Mock Generation Queue Status');
    console.log('='.repeat(80));
    
    // Get counts
    const counts = await queue.getJobCounts('active', 'waiting', 'completed', 'failed');
    console.log(`\n📊 Job Counts:`);
    console.log(`  Active:    ${counts.active}`);
    console.log(`  Waiting:   ${counts.waiting}`);
    console.log(`  Completed: ${counts.completed}`);
    console.log(`  Failed:    ${counts.failed}`);
    
    // Get active jobs
    const activeJobs = await queue.getActive();
    if (activeJobs.length > 0) {
      console.log(`\n🔄 Active Jobs (${activeJobs.length}):`);
      for (const job of activeJobs) {
        const { examId, mockNumber } = job.data;
        console.log(`  Job ${job.id}: Mock ${mockNumber} for exam ${examId}`);
        console.log(`    Progress: ${job.progress || 0}%`);
        console.log(`    Started: ${new Date(job.processedOn).toLocaleString()}`);
      }
    }
    
    // Get waiting jobs
    const waitingJobs = await queue.getWaiting();
    if (waitingJobs.length > 0) {
      console.log(`\n⏳ Waiting Jobs (${waitingJobs.length}):`);
      for (const job of waitingJobs) {
        const { examId, mockNumber } = job.data;
        console.log(`  Job ${job.id}: Mock ${mockNumber} for exam ${examId}`);
      }
    }
    
    // Get recent completed jobs
    const completedJobs = await queue.getCompleted(0, 4);
    if (completedJobs.length > 0) {
      console.log(`\n✅ Recent Completed Jobs (last ${completedJobs.length}):`);
      for (const job of completedJobs) {
        const { examId, mockNumber } = job.data;
        const duration = job.finishedOn ? ((job.finishedOn - job.processedOn) / 1000 / 60).toFixed(2) : 'N/A';
        console.log(`  Job ${job.id}: Mock ${mockNumber} for exam ${examId}`);
        console.log(`    Duration: ${duration} minutes`);
        console.log(`    Finished: ${new Date(job.finishedOn).toLocaleString()}`);
      }
    }
    
    // Get recent failed jobs
    const failedJobs = await queue.getFailed(0, 4);
    if (failedJobs.length > 0) {
      console.log(`\n❌ Recent Failed Jobs (last ${failedJobs.length}):`);
      for (const job of failedJobs) {
        const { examId, mockNumber } = job.data;
        console.log(`  Job ${job.id}: Mock ${mockNumber} for exam ${examId}`);
        console.log(`    Error: ${job.failedReason}`);
        console.log(`    Failed: ${new Date(job.finishedOn).toLocaleString()}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    
    await queue.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Redis connection refused. Make sure Redis is running:');
      console.error('   - Docker: docker-compose up -d redis');
      console.error('   - Local: brew services start redis (macOS)');
    }
    
    process.exit(1);
  }
}

monitorJobs();
