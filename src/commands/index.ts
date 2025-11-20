import archiveAll from "@workers/commands/archiver/archiveAll";
import { ormFeedUpdateFlagStatus } from "@workers/commands/orm/feed/updateFlagStatus";
import { parserRSSParseFeed } from "@workers/commands/parser/rss/parseFeed";
import { podcastIndexDeadFeedsDeleteCache, podcastIndexDeadFeedsFlagAndMerge } from "@workers/commands/podcastIndex/deadFeeds/flagAndMerge";
import podcastIndexTrendingPodcastsGet from "@workers/commands/podcastIndex/trending/podcastsGet";
import { podcastIndexValueUpdateAll } from "@workers/commands/podcastIndex/value/updateAll";
import { mqRSSAdd } from "@workers/commands/mq/rss/add";
import { mqRSSAddAll } from "@workers/commands/mq/rss/addAll";
import { mqRSSRunParser } from "@workers/commands/mq/rss/runParser";
import { mqRSSAddRecentlyUpdatedFeedsFromPodcastIndex } from "@workers/commands/mq/rss/mqRSSAddRecentlyUpdatedFeedsFromPodcastIndex";
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
  mqRSSAdd,
  mqRSSAddAll,
  mqRSSRunParser,
  mqRSSAddRecentlyUpdatedFeedsFromPodcastIndex,
  sandboxRun,
  statsUpdateAggregated,
  statsUpdateAggregatedRolling
} as { [key: string]: (args: CommandLineArgs) => void };
