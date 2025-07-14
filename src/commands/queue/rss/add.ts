import { QueueName, queueNames, queueRSSAdd as queueRSSAddFunction } from 'podverse-queue';
import { CommandLineArgs } from "@workers/commands";
import { rabbitMQService } from '@workers/factories/rabbitMQService';
import { podcastIndexService } from '@workers/factories/podcastIndexService';

export const queueRSSAdd = async (args: CommandLineArgs) => {
  const queueName = Array.isArray(args.q) ? args.q[0] : args.q;
  if (!queueName) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!queueNames.includes(queueName as QueueName)) {
    throw new Error(`Invalid queueName. Allowed values are: ${queueNames.join(', ')}`);
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

  await queueRSSAddFunction(
    rabbitMQService,
    {
      queueName: queueName as QueueName,
      feedUrl,
      podcastIndexId
    }
  );
};