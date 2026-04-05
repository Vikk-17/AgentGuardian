import { Queue } from 'bullmq';
import { redis } from './redis';

// Handles async approval flow for NUDGE tier actions
export const nudgeQueue = new Queue('nudge-actions', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
    attempts: 1, // No retry — approved actions execute once
  },
});

// Handles the actual execution of approved actions
export const executionQueue = new Queue('action-execution', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
