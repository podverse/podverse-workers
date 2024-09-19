import { parseRSSFeedAndSaveToDatabase } from 'podverse-parser';
import { CommandLineArgs } from "@workers/commands";

export const parserRSSParseFeed = async (args: CommandLineArgs) => {
  const url = Array.isArray(args.u) ? args.u[0] : args.u;
  if (!url) {
    throw new Error('url (-u) parameter is required');
  }

  const podcast_index_id = Array.isArray(args.p) ? args.p[0] : args.p;
  if (!podcast_index_id) {
    throw new Error('podcast_index_id (-p) parameter is required');
  }

  if (isNaN(Number(podcast_index_id))) {
    throw new Error('podcast_index_id (-p) must be a number');
  }

  await parseRSSFeedAndSaveToDatabase(url, Number(podcast_index_id));
};
