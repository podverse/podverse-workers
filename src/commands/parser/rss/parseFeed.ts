import { PodcastIndexService } from 'podverse-external-services';
import { parseRSSFeedAndSaveToDatabase } from 'podverse-parser';
import { CommandLineArgs } from "@workers/commands";
import { config } from '@workers/config';

export const parserRSSParseFeed = async (args: CommandLineArgs) => {
  const podcast_index_id = Array.isArray(args.p) ? args.p[0] : args.p;
  if (!podcast_index_id) {
    throw new Error('podcast_index_id (-p) parameter is required');
  }

  if (isNaN(Number(podcast_index_id))) {
    throw new Error('podcast_index_id (-p) must be a number');
  }

  const podcastIndexService = new PodcastIndexService({
    authKey: config.podcastIndex.authKey,
    baseUrl: config.podcastIndex.baseUrl,
    secretKey: config.podcastIndex.secretKey
  });

  const feedData = await podcastIndexService.podcastGetById(Number(podcast_index_id));
  const feedUrl = feedData?.feed?.url;
  if (!feedUrl) {
    throw new Error(`No feedUrl found for podcast_index_id ${podcast_index_id}`);
  }

  await parseRSSFeedAndSaveToDatabase(feedUrl, Number(podcast_index_id));
};
