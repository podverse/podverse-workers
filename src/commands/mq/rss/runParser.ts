import { CommandLineArgs } from "@workers/commands";
import { activeMQArtemisService } from "@workers/factories/activeMQArtemisService";
import { MQ_QUEUES, MQQueueNameParamKey, validMQQueueNamesParamKeys } from "podverse-helpers";
import { mqRSSRunParser as mqRSSRunParserFunction } from 'podverse-mq';

export const mqRSSRunParser = async (args: CommandLineArgs) => {
  const mqQueueNameParamKey = (Array.isArray(args.q) ? args.q[0] : args.q) as MQQueueNameParamKey | undefined;
  if (!mqQueueNameParamKey) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!validMQQueueNamesParamKeys.includes(mqQueueNameParamKey)) {
    throw new Error(`Invalid queueName. Allowed values are: ${validMQQueueNamesParamKeys.join(', ')}`);
  }

  const mqConstantMessageOptions = MQ_QUEUES[mqQueueNameParamKey];

  await mqRSSRunParserFunction(
    activeMQArtemisService,
    mqConstantMessageOptions.queueName
  );

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
