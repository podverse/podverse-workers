import { logError, logger } from 'podverse-helpers';
import { ArchiverService } from 'podverse-orm';

export default async function archiveAll(): Promise<void> {
  const archiverService = new ArchiverService();

  try {
    logger.info('Starting archiveAll process...');
    await archiverService.archiveAll();
    logger.info('archiveAll process completed successfully.');
  } catch (error) {
    logError('Error occurred during archiveAll process:', error);
  }
}
