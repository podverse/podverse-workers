import { PodcastIndexService } from 'podverse-external-services';
import { config } from '@workers/config';
import { DeduplicatorService } from '@workers/lib/deduplicator';
import { sleep } from 'podverse-helpers';

export const podcastIndexFlagAndMergeDeadFeeds = async () => {
  const podcastIndexService = new PodcastIndexService({
    authKey: config.podcastIndex.authKey,
    baseUrl: config.podcastIndex.baseUrl,
    secretKey: config.podcastIndex.secretKey
  });
  
  const deduplicatorService = new DeduplicatorService();
  let itemCount = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function resolveHandler(data: any) {
    itemCount++;
    const parsedData = podcastIndexService.deadFeedsExtractRow(data);
    if (itemCount % 100000 === 0) {
      console.log(`Processed ${itemCount} feeds. Current parsedData:`, parsedData);
    }
    try {
      const { id_to_archive, duplicate_id_to_keep } = parsedData;
      await deduplicatorService.handleDuplicatePodcastIndexId(id_to_archive, duplicate_id_to_keep);
      await sleep(2);
    } catch (error) {
      console.error('Error processing dead feed:', error);
      console.error('Data that caused the error:', parsedData);
    }
  }

  await podcastIndexService.deadFeedsDownloadAndExtractCSV(resolveHandler);
};
