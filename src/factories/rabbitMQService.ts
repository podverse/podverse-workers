import { RabbitMQService, RabbitMQServiceParams } from 'podverse-queue';
import { loggerService } from './loggerService';
import { config } from '@workers/config';

const rabbitParams: RabbitMQServiceParams = {
  protocol: config.queue.protocol,
  host: config.queue.host,
  port: config.queue.port,
  username: config.queue.username,
  password: config.queue.password,
  vhost: config.queue.vhost
};

export const rabbitMQService = new RabbitMQService(rabbitParams, loggerService);
