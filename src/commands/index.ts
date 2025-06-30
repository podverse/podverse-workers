import { parserRSSParseFeed } from "@workers/commands/parser/rss/parseFeed";
import { podcastIndexValueUpdateAll } from "@workers/commands/podcastIndex/value/updateAll";
import { queueRSSAddAll } from "@workers/commands/queue/rss/addAll";
import { queueDeleteAll } from "@workers/commands/queue/deleteAll";
import { queueRSSRunParser } from "@workers/commands/queue/rss/runParser";
import { queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex } from "@workers/commands/queue/rss/queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex";
import { queueRSSAddTrendingPodcastsFromPodcastIndex } from "@workers/commands/queue/rss/queueRSSAddTrendingPodcastsFromPodcastIndex";
import { sandboxRun } from "@workers/commands/sandbox/sandbox";
import { statsUpdateAggregated } from "@workers/commands/stats/statsUpdateAggregated";
import { statsUpdateAggregatedRolling } from "@workers/commands/stats/statsUpdateAggregatedRolling";
import { podcastIndexDeadFeedsRemove } from "./podcastIndex/deadFeeds/remove";
import archiveAll from "./archiver/archiveAll";
import podcastIndexTrendingPodcastsGet from "./podcastIndex/trending/podcastsGet";

export type CommandLineArgs = { [key: string]: string | string[] };

export default {
  archiveAll,
  parserRSSParseFeed,
  podcastIndexDeadFeedsRemove,
  podcastIndexTrendingPodcastsGet,
  podcastIndexValueUpdateAll,
  queueDeleteAll,
  queueRSSAddAll,
  queueRSSRunParser,
  queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex,
  queueRSSAddTrendingPodcastsFromPodcastIndex,
  sandboxRun,
  statsUpdateAggregated,
  statsUpdateAggregatedRolling
} as { [key: string]: (args: CommandLineArgs) => void };
