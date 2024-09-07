import { CommandLineArgs } from '@workers/commands';
import { QueueName, queueNames,
  queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex as queueRSSAddRecentlyUpdatedFeedsFromPodcastIndexFunction
} from 'podverse-queue';

export const queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex = async (args: CommandLineArgs) => {
  const queueName = Array.isArray(args.q) ? args.q[0] : args.q;
  if (!queueName) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!queueNames.includes(queueName as QueueName)) {
    throw new Error(`Invalid queueName. Allowed values are: ${queueNames.join(', ')}`);
  }

  await queueRSSAddRecentlyUpdatedFeedsFromPodcastIndexFunction({ queueName });
};
