import { CommandLineArgs } from "@workers/commands";
import { activeMQArtemisService } from "@workers/factories/activeMQArtemisService";
import { MQ_QUEUES, MQQueueNameParamKey, validMQQueueNamesParamKeys } from "podverse-helpers";
import { mqRSSRunParser as mqRSSRunParserFunction, getIsProcessing } from 'podverse-mq';

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

  // Setup graceful shutdown handlers
  const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log('Shutdown signal received.');
    
    // First, close receivers to stop accepting new messages from the broker
    // This prevents new messages from entering the processing pipeline
    await activeMQArtemisService.close();
    console.log('Stopped accepting new messages from broker.');
    
    // Now wait for any in-progress parsing to complete
    // Messages already received before close() are still in the handler
    if (getIsProcessing()) {
      console.log('Waiting for current parsing operation to complete...');
      while (getIsProcessing()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('Processing complete.');
    }
    
    console.log('Graceful shutdown complete');
    process.exit(0);
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
