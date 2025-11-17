import { CommandLineArgs } from '@workers/commands';
import { podcastIndexService } from '@workers/factories/podcastIndexService';
import { activeMQArtemisService } from '@workers/factories/activeMQArtemisService';
import { QueueName, validQueueNames,
  queueRSSAddTrendingPodcastsFromPodcastIndex as queueRSSAddTrendingPodcastsFromPodcastIndexFunction } from 'podverse-queue';

export const queueRSSAddTrendingPodcastsFromPodcastIndex = async (args: CommandLineArgs) => {
  const queueName = Array.isArray(args.q) ? args.q[0] : args.q;
  if (!queueName) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!validQueueNames.includes(queueName as QueueName)) {
    throw new Error(`Invalid queueName. Allowed values are: ${validQueueNames.join(', ')}`);
  }

  let maxFeeds = 50;
  if ('maxFeeds' in args) {
    const parsedMax = parseInt(Array.isArray(args.maxFeeds) ? args.maxFeeds[0] : args.maxFeeds, 10);
    if (!isNaN(parsedMax) && parsedMax > 0) {
      maxFeeds = parsedMax;
    }
  }

  await queueRSSAddTrendingPodcastsFromPodcastIndexFunction(
    activeMQArtemisService,
    podcastIndexService,
    { queueName, maxFeeds }
  );
};
