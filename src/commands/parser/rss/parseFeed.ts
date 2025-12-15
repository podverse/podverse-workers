import { parseRSSFeedAndSaveToDatabase } from 'podverse-parser';
import { CommandLineArgs } from "@workers/commands";
import { podcastIndexService } from '@workers/factories/podcastIndexService';

export const parserRSSParseFeed = async (args: CommandLineArgs) => {
  const podcast_index_id = Array.isArray(args.p) ? args.p[0] : args.p;
  if (!podcast_index_id) {
    throw new Error('podcast_index_id (-p) parameter is required');
  }

  if (isNaN(Number(podcast_index_id))) {
    throw new Error('podcast_index_id (-p) must be a number');
  }

  const feedData = await podcastIndexService.podcastGetById(Number(podcast_index_id));
  const feedUrl = feedData?.feed?.url;
  if (!feedUrl) {
    throw new Error(`No feedUrl found for podcast_index_id ${podcast_index_id}`);
  }
  
  const hasForceParse = (
    typeof args.f !== 'undefined' || typeof args.forceParse !== 'undefined'
  );
  const options = hasForceParse ? {
    forceParse: true,
    onDemandParserEvent: {
      accountId: null,
      type: null,
      remoteParentPodcastIndexId: null
    }
  } : {
    forceParse: false,
    onDemandParserEvent: {
      accountId: null,
      type: null,
      remoteParentPodcastIndexId: null
    }
  };

  await parseRSSFeedAndSaveToDatabase(feedUrl, Number(podcast_index_id), options);
};
