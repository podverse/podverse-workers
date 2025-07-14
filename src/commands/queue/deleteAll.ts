import { rabbitMQService } from '@workers/factories/rabbitMQService';
import { queueDeleteAll as queueDeleteAllFunction } from 'podverse-queue';

export const queueDeleteAll = async () => {
  await queueDeleteAllFunction(rabbitMQService);  
};
