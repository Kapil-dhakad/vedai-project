import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import { createRedisConnection } from '../config/redis';
import Assignment from '../models/Assignment';
import QuestionPaper from '../models/QuestionPaper';
import aiService from '../services/aiService';
import wsManager from '../websocket/wsManager';
import { GenerationJobData } from '../queues/generationQueue';

const processGenerationJob = async (job: Job<GenerationJobData>): Promise<void> => {
  const { assignmentId } = job.data;
  console.log(`\n⚙️  Processing job ${job.id} for assignment ${assignmentId}`);

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });

  wsManager.broadcast(assignmentId, {
    type: 'status',
    status: 'processing',
    message: 'AI is generating your question paper...',
    progress: 10,
  });

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }

  await job.updateProgress(20);
  wsManager.broadcast(assignmentId, {
    type: 'status',
    status: 'processing',
    message: 'Building AI prompt...',
    progress: 20,
  });

  const generated = await aiService.generateQuestionPaper(assignment);

  await job.updateProgress(80);
  wsManager.broadcast(assignmentId, {
    type: 'status',
    status: 'processing',
    message: 'Saving question paper...',
    progress: 80,
  });

  const questionPaper = await QuestionPaper.create({
    assignmentId: assignment._id,
    schoolName: assignment.schoolName,
    subject: assignment.subject,
    grade: assignment.grade,
    timeAllowed: generated.timeAllowed,
    totalMarks: generated.totalMarks,
    sections: generated.sections,
    generalInstruction: generated.generalInstruction,
    generatedAt: new Date(),
  });

  await Assignment.findByIdAndUpdate(assignmentId, {
    status: 'completed',
    questionPaperId: questionPaper._id,
    jobId: job.id,
  });

  await job.updateProgress(100);

  wsManager.broadcast(assignmentId, {
    type: 'status',
    status: 'completed',
    paperId: questionPaper._id.toString(),
    message: 'Question paper generated successfully!',
    progress: 100,
  });

  console.log(`✅ Job ${job.id} completed. Paper ID: ${questionPaper._id}`);
};

export const initGenerationWorker = (): Worker<GenerationJobData> => {
  const worker = new Worker<GenerationJobData>(
    'question-generation',
    processGenerationJob,
    {
      connection: createRedisConnection(),
      concurrency: 2,
    }
  );

  worker.on('active', (job) => {
    console.log(`▶️  Job ${job.id} started (in-process)`);
  });

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully (in-process)`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`❌ Job ${job?.id} failed (in-process):`, err.message);

    if (job?.data?.assignmentId) {
      await Assignment.findByIdAndUpdate(job.data.assignmentId, {
        status: 'failed',
        errorMessage: err.message,
      });

      wsManager.broadcast(job.data.assignmentId, {
        type: 'error',
        status: 'failed',
        message: `Generation failed: ${err.message}`,
      });
    }
  });

  worker.on('error', (err) => {
    console.error('❌ Worker error (in-process):', err);
  });

  console.log('🚀 Generation worker started inside Express process');
  return worker;
};

const startWorker = async () => {
  await connectDB();

  const worker = new Worker<GenerationJobData>(
    'question-generation',
    processGenerationJob,
    {
      connection: createRedisConnection(),
      concurrency: 2,
    }
  );

  worker.on('active', (job) => {
    console.log(`▶️  Job ${job.id} started`);
  });

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);

    if (job?.data?.assignmentId) {
      await Assignment.findByIdAndUpdate(job.data.assignmentId, {
        status: 'failed',
        errorMessage: err.message,
      });

      wsManager.broadcast(job.data.assignmentId, {
        type: 'error',
        status: 'failed',
        message: `Generation failed: ${err.message}`,
      });
    }
  });

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err);
  });

  console.log('🚀 Standalone generation worker started and listening for jobs...');

  const shutdown = async () => {
    console.log('\n🛑 Shutting down worker...');
    await worker.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

// Check if run directly
if (require.main === module) {
  startWorker().catch((err) => {
    console.error('Failed to start worker:', err);
    process.exit(1);
  });
}
