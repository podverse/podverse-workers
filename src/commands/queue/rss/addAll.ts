import { QueueName, queueNames, queueRSSAddAll as queueRSSAddAllFunction } from 'podverse-queue';
import { CommandLineArgs } from "@workers/commands";
import { rabbitMQService } from '@workers/factories/rabbitMQService';

export const queueRSSAddAll = async (args: CommandLineArgs) => {
  const queueName = Array.isArray(args.q) ? args.q[0] : args.q;
  if (!queueName) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!queueNames.includes(queueName as QueueName)) {
    throw new Error(`Invalid queueName. Allowed values are: ${queueNames.join(', ')}`);
  }

  await queueRSSAddAllFunction(
    rabbitMQService,
    { queueName: queueName as QueueName }
  );
};
