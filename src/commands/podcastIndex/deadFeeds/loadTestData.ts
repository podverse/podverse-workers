import { parseRSSFeedAndSaveToDatabase } from 'podverse-parser';
import { ChannelService, FeedService } from 'podverse-orm';
import { podcastIndexService } from '../../../factories/podcastIndexService';

export const loadTestData = async (podcast_index_id_1: number, podcast_index_id_2: number) => {
  // 1. Get feed data for podcast_index_id_1
  const feedData = await podcastIndexService.podcastGetById(podcast_index_id_1);
  if (!feedData?.feed?.url) {
    throw new Error(`No feed found for podcast_index_id ${podcast_index_id_1}`);
  }
  const feedUrl = feedData.feed.url;

  // 2. Parse and save to database
  await parseRSSFeedAndSaveToDatabase(feedUrl, podcast_index_id_1);

  // 3. Change the podcast_index_id of the channel to podcast_index_id_2, and update feed.url
  const channelService = new ChannelService();
  const channel = await channelService.getByPodcastIndexId(podcast_index_id_1, { feed: true });
  if (!channel || !channel.feed) {
    throw new Error(`Channel or feed not found for podcast_index_id ${podcast_index_id_1}`);
  }

  // Update channel's podcast_index_id
  await channelService.updatePodcastIndexId(channel.id, podcast_index_id_2);

  // Update feed url
  const feedService = new FeedService();
  const newUrl = feedUrl + 'duplicate-test';
  await feedService.update(channel.feed.id, { url: newUrl });

  // 4. Run parseRSSFeedAndSaveToDatabase again with the original podcast_index_id_1
  await parseRSSFeedAndSaveToDatabase(feedUrl, podcast_index_id_1);
};
