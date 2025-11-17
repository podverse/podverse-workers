import { MQ_QUEUES, QueueNameParamKey, validQueueNamesParamKeys } from 'podverse-helpers';
import { CommandLineArgs } from '@workers/commands';
import { podcastIndexService } from '@workers/factories/podcastIndexService';
import { activeMQArtemisService } from '@workers/factories/activeMQArtemisService';
import { queueRSSAddTrendingPodcastsFromPodcastIndex as queueRSSAddTrendingPodcastsFromPodcastIndexFunction } from 'podverse-queue';

export const queueRSSAddTrendingPodcastsFromPodcastIndex = async (args: CommandLineArgs) => {
  const queueNameParamKey = (Array.isArray(args.q) ? args.q[0] : args.q) as QueueNameParamKey | undefined;
  if (!queueNameParamKey) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!validQueueNamesParamKeys.includes(queueNameParamKey)) {
    throw new Error(`Invalid queueName. Allowed values are: ${validQueueNamesParamKeys.join(', ')}`);
  }

  let maxFeeds = 50;
  if ('maxFeeds' in args) {
    const parsedMax = parseInt(Array.isArray(args.maxFeeds) ? args.maxFeeds[0] : args.maxFeeds, 10);
    if (!isNaN(parsedMax) && parsedMax > 0) {
      maxFeeds = parsedMax;
    }
  }

  const mqConstantMessageOptions = MQ_QUEUES[queueNameParamKey];

  await queueRSSAddTrendingPodcastsFromPodcastIndexFunction(
    activeMQArtemisService,
    podcastIndexService,
    {
      ...mqConstantMessageOptions,
      maxFeeds
    }
  );
};
