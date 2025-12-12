
import { mqRSSSetupDlqConsumers } from 'podverse-mq';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { activeMQArtemisService } from '@workers/factories/activeMQArtemisService';
import { logger } from '@workers/factories/logger';
import { config } from '@workers/config';

export const mqRSSRunDlqConsumer = async () => {
  logger.info('DLQ consumer process started.');

  await activeMQArtemisService.initialize();

  const logDir = config.log.dir || './logs';

  const dlqLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console({ level: 'info' }),
      new winston.transports.DailyRotateFile({
        filename: `${logDir}/dlq-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
      })
    ]
  });

  const loggerFunc = (logMessage: string) => {
    try {
      const logObject = JSON.parse(logMessage);
      dlqLogger.log(logObject);
    } catch {
      dlqLogger.info(logMessage);
    }
  };

  await mqRSSSetupDlqConsumers(activeMQArtemisService, loggerFunc);

  logger.info('DLQ consumers are running. Press Ctrl+C to exit.');

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
