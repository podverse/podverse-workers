import { CommandLineArgs } from '@workers/commands';
import { podcastIndexService } from '@workers/factories/podcastIndexService';
import { activeMQArtemisService } from '@workers/factories/activeMQArtemisService';
import { queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex as queueRSSAddRecentlyUpdatedFeedsFromPodcastIndexFunction
} from 'podverse-queue';
import { MQ_QUEUES, QueueNameParamKey, validQueueNamesParamKeys } from 'podverse-helpers';

export const queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex = async (args: CommandLineArgs) => {
  const queueNameParamKey = (Array.isArray(args.q) ? args.q[0] : args.q) as QueueNameParamKey | undefined;
  if (!queueNameParamKey) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!validQueueNamesParamKeys.includes(queueNameParamKey)) {
    throw new Error(`Invalid queueName. Allowed values are: ${validQueueNamesParamKeys.join(', ')}`);
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

  const mqConstantMessageOptions = MQ_QUEUES[queueNameParamKey];

  await queueRSSAddRecentlyUpdatedFeedsFromPodcastIndexFunction(
    activeMQArtemisService,
    podcastIndexService,
    {
      ...mqConstantMessageOptions,
      sinceRange
    }
  );
};
