import { CommandLineArgs } from '@workers/commands';
import { podcastIndexService } from '@workers/factories/podcastIndexService';
import { rabbitMQService } from '@workers/factories/rabbitMQService';
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

  let sinceRange: number | undefined;
  const sinceRangeArg = 'sinceRange' in args ? args.sinceRange : ('sr' in args ? args.sr : undefined);
  if (sinceRangeArg !== undefined) {
    const parsedSinceRange = parseInt(Array.isArray(sinceRangeArg) ? sinceRangeArg[0] : sinceRangeArg, 10);
    if (!isNaN(parsedSinceRange) && parsedSinceRange > 0) {
      sinceRange = parsedSinceRange;
    }
  }

  if (!sinceRange) {
    throw new Error('sinceRange (-sr) parameter is required');
  }

  await queueRSSAddRecentlyUpdatedFeedsFromPodcastIndexFunction(
    rabbitMQService,
    podcastIndexService,
    { queueName, sinceRange }
  );
};
