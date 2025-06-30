import { PodcastIndexService } from 'podverse-external-services';
import { config } from '@workers/config';

export const podcastIndexDeadFeedsRemove = async () => {
  const podcastIndexService = new PodcastIndexService({
    authKey: config.podcastIndex.authKey,
    baseUrl: config.podcastIndex.baseUrl,
    secretKey: config.podcastIndex.secretKey
  });

  const results = await podcastIndexService.deadFeedsDownloadAndExtractCSV();

  console.log(results.length);
  console.log(results[results.length - 6]);
  console.log(results[results.length - 5]);
  console.log(results[results.length - 4]);
  console.log(results[results.length - 3]);
  console.log(results[results.length - 2]);
  console.log(results[results.length - 1]);
  console.log(results[results.length - 0]);
};
