import { CommandLineArgs } from "@workers/commands";
import { activeMQArtemisService } from "@workers/factories/activeMQArtemisService";
import { QueueName, queueNames, queueRSSRunParser as queueRSSRunParserFunction } from 'podverse-queue';

export const queueRSSRunParser = async (args: CommandLineArgs) => {
  const queueName = Array.isArray(args.q) ? args.q[0] : args.q;
  if (!queueName) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!queueNames.includes(queueName as QueueName)) {
    throw new Error(`Invalid queueName. Allowed values are: ${queueNames.join(', ')}`);
  }

  await queueRSSRunParserFunction(
    activeMQArtemisService,
    queueName as QueueName
  );

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
