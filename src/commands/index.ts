import { parserRSSParseFeed } from "@workers/commands/parser/rss/parseFeed";
import { podcastIndexUpdateValueTagEnabledPodcastIds } from "@workers/commands/podcastIndex/valueTags/podcastIndexUpdateValueTagEnabledPodcastIds";
import { queueRSSAddAll } from "@workers/commands/queue/rss/addAll";
import { queueDeleteAll } from "@workers/commands/queue/deleteAll";
import { queueRSSRunParser } from "@workers/commands/queue/rss/runParser";
import { queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex } from "@workers/commands/queue/rss/queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex";
import { sandboxRun } from "@workers/commands/sandbox/sandbox";
import { statsUpdateAggregated } from "@workers/commands/stats/statsUpdateAggregated";
import { statsUpdateAggregatedRolling } from "@workers/commands/stats/statsUpdateAggregatedRolling";

export type CommandLineArgs = { [key: string]: string | string[] };

export default {
  parserRSSParseFeed,
  podcastIndexUpdateValueTagEnabledPodcastIds,
  queueDeleteAll,
  queueRSSAddAll,
  queueRSSRunParser,
  queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex,
  sandboxRun,
  statsUpdateAggregated,
  statsUpdateAggregatedRolling
} as { [key: string]: (args: CommandLineArgs) => void };
