import archiveAll from "@workers/commands/archiver/archiveAll";
import { ormFeedUpdateFlagStatus } from "@workers/commands/orm/feed/updateFlagStatus";
import { parserRSSParseFeed } from "@workers/commands/parser/rss/parseFeed";
import { podcastIndexDeadFeedsDeleteCache, podcastIndexDeadFeedsFlagAndMerge } from "@workers/commands/podcastIndex/deadFeeds/flagAndMerge";
import podcastIndexTrendingPodcastsGet from "@workers/commands/podcastIndex/trending/podcastsGet";
import { podcastIndexValueUpdateAll } from "@workers/commands/podcastIndex/value/updateAll";
import { queueDeleteAll } from "@workers/commands/queue/deleteAll";
import { queueRSSAdd } from "@workers/commands/queue/rss/add";
import { queueRSSAddAll } from "@workers/commands/queue/rss/addAll";
import { queueRSSRunParser } from "@workers/commands/queue/rss/runParser";
import { queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex } from "@workers/commands/queue/rss/queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex";
import { queueRSSAddTrendingPodcastsFromPodcastIndex } from "@workers/commands/queue/rss/queueRSSAddTrendingPodcastsFromPodcastIndex";
import { sandboxRun } from "@workers/commands/sandbox/sandbox";
import { statsUpdateAggregated } from "@workers/commands/stats/statsUpdateAggregated";
import { statsUpdateAggregatedRolling } from "@workers/commands/stats/statsUpdateAggregatedRolling";

export type CommandLineArgs = { [key: string]: string | string[] };

export default {
  archiveAll,
  ormFeedUpdateFlagStatus,
  parserRSSParseFeed,
  podcastIndexDeadFeedsDeleteCache,
  podcastIndexDeadFeedsFlagAndMerge,
  podcastIndexTrendingPodcastsGet,
  podcastIndexValueUpdateAll,
  queueDeleteAll,
  queueRSSAdd,
  queueRSSAddAll,
  queueRSSRunParser,
  queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex,
  queueRSSAddTrendingPodcastsFromPodcastIndex,
  sandboxRun,
  statsUpdateAggregated,
  statsUpdateAggregatedRolling
} as { [key: string]: (args: CommandLineArgs) => void };
