import './module-alias-config';

if (process.env.NODE_ENV !== 'production') {
  require('@dotenvx/dotenvx').config({ path: '.env' });
}

import { logError, logger } from 'podverse-helpers';
import { AppDataSourceRead, AppDataSourceReadWrite } from 'podverse-orm';
import commands from '@workers/commands';
import { parseArgs } from '@workers/commands/parseArgs';

const args = parseArgs();
const commandName = (args._ as string[])[0];

if (!commandName) process.exit(1);

const command = commands[commandName];

const runApp = async () => {
  try {
    logger.info("Connecting to the databases");
    await AppDataSourceRead.initialize();
    await AppDataSourceReadWrite.initialize();
    logger.info("Connected to the databases");

    if (command) {
      await command(args);
    } else {
      logError(`runApp: Command "${commandName}" not found.`);
    }
  } catch (error) {
    logError('Error running app:', error as Error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

runApp();
