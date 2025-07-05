import { Channel, ChannelService, DeduplicatorService as DeduplicatorServiceORM, FeedFlagStatusStatusEnum, FeedService } from 'podverse-orm';

export class DeduplicatorService {
  private channelService = new ChannelService();
  private deduplicatorServiceORM = new DeduplicatorServiceORM();

  async handleDuplicatePodcastIndexId(id_to_remove: number, duplicate_id_to_keep: number | null): Promise<void> {    
    const channelToRemove: Channel | null = await this.getChannelByPodcastIndexId(id_to_remove);
    if (channelToRemove) {     
      let duplicateChannelToKeep: Channel | null = null;
      if (duplicate_id_to_keep || duplicate_id_to_keep === 0) {
        duplicateChannelToKeep = await this.getChannelByPodcastIndexId(duplicate_id_to_keep);
      }

      if (duplicateChannelToKeep) {
        await this.deduplicatorServiceORM.mergeChannels(channelToRemove.id, duplicateChannelToKeep.id);
      }
      
      if (channelToRemove.feed) {
        const feedService = new FeedService();
        await feedService.updateFlagStatus(channelToRemove.feed, FeedFlagStatusStatusEnum.PendingArchive);
      }

      return;
    }
  }

  private async getChannelByPodcastIndexId(podcast_index_id: number) {
    return this.channelService.getByPodcastIndexId(podcast_index_id, { feed: true });
  }
}
