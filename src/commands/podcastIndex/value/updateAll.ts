import { PodcastIndexService } from 'podverse-external-services';
import { config } from '@workers/config';

export const podcastIndexValueUpdateAll = async () => {
  const podcastIndexService = new PodcastIndexService({
    authKey: config.podcastIndex.authKey,
    baseUrl: config.podcastIndex.baseUrl,
    secretKey: config.podcastIndex.secretKey
  });

  const podcastIndexFeedIds = await podcastIndexService.valueGetByPodcastIds();

  console.log('podcastIndexFeedIds', podcastIndexFeedIds);
};
