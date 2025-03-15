import { parserRSSParseFeed } from "@workers/commands/parser/rss/parseFeed";
import { podcastIndexUpdateValueTagEnabledPodcastIds } from "@workers/commands/podcastIndex/valueTags/podcastIndexUpdateValueTagEnabledPodcastIds";
import { queueDeleteAll } from "@workers/commands/queue/deleteAll";
import { queueRSSAddAll } from "@workers/commands/queue/rss/addAll";
import { queueRSSRunParser } from "@workers/commands/queue/rss/runParser";
import { queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex } from "@workers/commands/queue/rss/queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex";
import { sandboxRun } from "./sandbox/sandbox";

export type CommandLineArgs = { [key: string]: string | string[] };

export default {
  parserRSSParseFeed,
  podcastIndexUpdateValueTagEnabledPodcastIds,
  queueDeleteAll,
  queueRSSAddAll,
  queueRSSRunParser,
  queueRSSAddRecentlyUpdatedFeedsFromPodcastIndex,
  sandboxRun
} as { [key: string]: (args: CommandLineArgs) => void };
