import { queueRSSAddAll as queueRSSAddAllFunction } from 'podverse-queue';
import { CommandLineArgs } from "@workers/commands";
import { activeMQArtemisService } from '@workers/factories/activeMQArtemisService';
import { MQ_QUEUES, QueueNameParamKey, validQueueNamesParamKeys } from 'podverse-helpers';

export const queueRSSAddAll = async (args: CommandLineArgs) => {
  const queueNameParamKey = (Array.isArray(args.q) ? args.q[0] : args.q) as QueueNameParamKey | undefined;
  if (!queueNameParamKey) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!validQueueNamesParamKeys.includes(queueNameParamKey)) {
    throw new Error(`Invalid queueName. Allowed values are: ${validQueueNamesParamKeys.join(', ')}`);
  }

  const mqConstantMessageOptions = MQ_QUEUES[queueNameParamKey];
  await queueRSSAddAllFunction(
    activeMQArtemisService,
    mqConstantMessageOptions
  );
};
