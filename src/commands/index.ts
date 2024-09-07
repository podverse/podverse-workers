import { queueDeleteAll } from "@workers/commands/queue/deleteAll";
import { queueRSSAddAll } from "@workers/commands/queue/rss/addAll";
import { queueRSSRunParser } from "@workers/commands/queue/rss/runParser";
import { queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex } from "@workers/commands/queue/rss/queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex";

export type CommandLineArgs = { [key: string]: string | string[] };

export default {
  queueDeleteAll,
  queueRSSAddAll,
  queueRSSRunParser,
  queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex
} as { [key: string]: (args: CommandLineArgs) => void };
