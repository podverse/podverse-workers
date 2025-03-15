import { PodcastIndexService } from 'podverse-external-services';
import { config } from '@workers/config';

export const podcastIndexUpdateValueTagEnabledPodcastIds = async () => {
  const podcastIndexService = new PodcastIndexService({
    authKey: config.podcastIndex.authKey,
    baseUrl: config.podcastIndex.baseUrl,
    secretKey: config.podcastIndex.secretKey
  });

  const podcastIndexFeedIds = await podcastIndexService.getValueTagEnabledPodcastIds();

  console.log('podcastIndexFeedIds', podcastIndexFeedIds);
};
