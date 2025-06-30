import { logger } from 'podverse-helpers';
import { PodcastIndexService } from 'podverse-external-services';
import { config } from '@workers/config';
import { CommandLineArgs } from '@workers/commands';

const podcastIndexTrendingPodcastsGet = async (args: CommandLineArgs) => {
  try {
    logger.info('[podcastIndex/trending/podcastsGet] Starting trending podcasts fetch...');

    let max = 1000;
    let since: number | undefined;
    let lang: string | undefined;
    let cat: string | undefined;

    if ('max' in args) {
      const parsedMax = parseInt(Array.isArray(args.max) ? args.max[0] : args.max, 10);
      if (!isNaN(parsedMax) && parsedMax > 0 && parsedMax <= 1000) {
        max = parsedMax;
      }
    }
    if ('since' in args) {
      const parsedSince = parseInt(Array.isArray(args.since) ? args.since[0] : args.since, 10);
      if (!isNaN(parsedSince) && parsedSince > 0) {
        since = parsedSince;
      }
    }
    if ('lang' in args) {
      lang = Array.isArray(args.lang) ? args.lang[0] : args.lang;
    }
    if ('cat' in args) {
      cat = Array.isArray(args.cat) ? args.cat[0] : args.cat;
    }

    const podcastIndexService = new PodcastIndexService({
      authKey: config.podcastIndex.authKey,
      baseUrl: config.podcastIndex.baseUrl,
      secretKey: config.podcastIndex.secretKey,
    });

    const { feeds } = await podcastIndexService.trendingGetPodcasts(max, since, lang, cat);

    logger.info(`[podcastIndex/trending/podcastsGet] Fetched ${feeds.length} trending feeds.`);
    logger.info('[podcastIndex/trending/podcastsGet] Example feeds:', feeds.slice(0, 3));

    return feeds;
  } catch (error) {
    logger.error('[podcastIndex/trending/podcastsGet] Error fetching trending podcasts:', error);
    throw error;
  }
};

export default podcastIndexTrendingPodcastsGet;