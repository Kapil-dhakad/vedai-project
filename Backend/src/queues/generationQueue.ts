import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';

export interface GenerationJobData {
  assignmentId: string;
}

let generationQueue: Queue<any> | null = null;

export const getGenerationQueue = (): Queue<GenerationJobData> => {
  if (!generationQueue) {
    generationQueue = new Queue('question-generation', {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 24 * 3600 },
      },
    });

    generationQueue.on('error', (err: Error) => {
      console.error('❌ Queue error:', err.message);
    });

    console.log('✅ BullMQ generation queue initialized');
  }

  return generationQueue as Queue<GenerationJobData>;
};

export const addGenerationJob = async (assignmentId: string): Promise<string> => {
  const queue = getGenerationQueue();
  const job = await queue.add(
    'generate-paper',
    { assignmentId } as GenerationJobData,
    { jobId: `gen-${assignmentId}` }
  );
  return job.id as string;
};
