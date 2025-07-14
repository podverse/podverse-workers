import { TimerManager } from 'podverse-helpers';
import { loggerService } from './loggerService';
import { config } from '@workers/config';

const shouldLogTimer = config.log.timer;

export const timerManager = new TimerManager(shouldLogTimer, loggerService);
