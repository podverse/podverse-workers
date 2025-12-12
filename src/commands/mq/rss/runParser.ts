import { CommandLineArgs } from "@workers/commands";
import { activeMQArtemisService } from "@workers/factories/activeMQArtemisService";
import { MQ_QUEUES, MQQueueNameParamKey, validMQQueueNamesParamKeys } from "podverse-helpers";
import { mqRSSRunParser as mqRSSRunParserFunction } from 'podverse-mq';

let isShuttingDown = false;

export const mqRSSRunParser = async (args: CommandLineArgs) => {
  const mqQueueNameParamKey = (Array.isArray(args.q) ? args.q[0] : args.q) as MQQueueNameParamKey | undefined;
  if (!mqQueueNameParamKey) {
    throw new Error('queueName (-q) parameter is required');
  }

  if (!validMQQueueNamesParamKeys.includes(mqQueueNameParamKey)) {
    throw new Error(`Invalid queueName. Allowed values are: ${validMQQueueNamesParamKeys.join(', ')}`);
  }

  const mqConstantMessageOptions = MQ_QUEUES[mqQueueNameParamKey];

  // Setup shutdown handlers that IGNORE the signal (for testing stop_grace_period)
  const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log('Shutdown signal received - IGNORING IT TO TEST stop_grace_period');
    console.log('Waiting for Docker to force kill after 5m...');
    
    // Just wait forever - Docker will eventually force kill us
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log('Still waiting for force kill...');
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  await mqRSSRunParserFunction(
    activeMQArtemisService,
    mqConstantMessageOptions.queueName
  );

  while (!isShuttingDown) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
