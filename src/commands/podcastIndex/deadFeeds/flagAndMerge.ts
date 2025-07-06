import { PodcastIndexService } from 'podverse-external-services';
import { config } from '@workers/config';
import { DeduplicatorService } from '@workers/lib/deduplicator';
import { CommandLineArgs } from '@workers/commands';
// import { loadTestData } from './loadTestData';

export const podcastIndexFlagAndMergeDeadFeeds = async (args: CommandLineArgs) => {
  const numberOfLatestFeeds = (args.n ?? args.numberOfLatestFeeds ?? '10').toString();
  const podcastIndexService = new PodcastIndexService({
    authKey: config.podcastIndex.authKey,
    baseUrl: config.podcastIndex.baseUrl,
    secretKey: config.podcastIndex.secretKey
  });

  const results = await podcastIndexService.deadFeedsDownloadAndExtractCSV();
  
  const deduplicatorService = new DeduplicatorService();

  const shortResults = results.slice(-parseInt(numberOfLatestFeeds)).reverse();

  for (const result of shortResults) {
    try {
      const { id_to_archive, duplicate_id_to_keep } = result;
      // await loadTestData(duplicate_id_to_keep, id_to_archive);
      await deduplicatorService.handleDuplicatePodcastIndexId(id_to_archive, duplicate_id_to_keep);
    } catch (error) {
      console.error(`Error processing podcast_index_id: ${result.podcast_index_id}`, error);
    }
  }
};
