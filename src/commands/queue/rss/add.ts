import { queueRSSAdd as queueRSSAddFunction } from 'podverse-queue';
import { CommandLineArgs } from "@workers/commands";
import { activeMQArtemisService } from '@workers/factories/activeMQArtemisService';
import { podcastIndexService } from '@workers/factories/podcastIndexService';
import { MQ_QUEUES, QueueNameParamKey, validQueueNamesParamKeys } from 'podverse-helpers';

export const queueRSSAdd = async (args: CommandLineArgs) => {
  const queueNameParamKey = (Array.isArray(args.q) ? args.q[0] : args.q) as QueueNameParamKey | undefined;
  if (!queueNameParamKey) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!validQueueNamesParamKeys.includes(queueNameParamKey)) {
    throw new Error(`Invalid queueName. Allowed values are: ${validQueueNamesParamKeys.join(', ')}`);
  }

  const podcastIndexIdArg = Array.isArray(args.p) ? args.p[0] : args.p;
  if (!podcastIndexIdArg) {
    throw new Error('podcast_index_id (-p) parameter is required');
  }

  const podcastIndexId = Number(podcastIndexIdArg);
  if (isNaN(podcastIndexId)) {
    throw new Error('podcast_index_id (-p) must be a number');
  }

  const feedData = await podcastIndexService.podcastGetById(podcastIndexId);
  const feedUrl = feedData?.feed?.url;
  if (!feedUrl) {
    throw new Error(`No feedUrl found for podcast_index_id ${podcastIndexId}`);
  }

  const mqConstantMessageOptions = MQ_QUEUES[queueNameParamKey];

  await queueRSSAddFunction(
    activeMQArtemisService,
    {
      ...mqConstantMessageOptions,
      feedUrl,
      podcastIndexId
    }
  );
};