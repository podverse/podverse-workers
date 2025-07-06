import { PodcastIndexService } from 'podverse-external-services';
import { config } from '@workers/config';
import { DeduplicatorService } from '@workers/lib/deduplicator';
import fs from 'fs';

const CACHE_FILE_PATH = '/data/dead_feeds_cache.json';

function loadCache(): Set<number> {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      const arr = JSON.parse(raw);
      return new Set<number>(arr);
    }
  } catch (err) {
    console.error('Failed to load cache:', err);
  }
  return new Set<number>();
}

function saveCache(cache: Set<number>) {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(Array.from(cache)), 'utf-8');
  } catch (err) {
    console.error('Failed to save cache:', err);
  }
}

export const podcastIndexFlagAndMergeDeadFeeds = async () => {
  const podcastIndexService = new PodcastIndexService({
    authKey: config.podcastIndex.authKey,
    baseUrl: config.podcastIndex.baseUrl,
    secretKey: config.podcastIndex.secretKey
  });

  const deduplicatorService = new DeduplicatorService();
  let itemCount = 0;
  const cache = loadCache();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function resolveHandler(data: any) {
    itemCount++;
    const parsedData = podcastIndexService.deadFeedsExtractRow(data);
    const { id_to_archive, duplicate_id_to_keep } = parsedData;

    if (cache.has(id_to_archive)) {
      if (itemCount % 100000 === 0) {
        console.log(`Skipped ${itemCount} feeds. Already handled id_to_archive: ${id_to_archive}`);
      }
      return;
    }

    if (itemCount % 100000 === 0) {
      console.log(`Processed ${itemCount} feeds. Current parsedData:`, parsedData);
    }
    try {
      await deduplicatorService.handleDuplicatePodcastIndexId(id_to_archive, duplicate_id_to_keep);
      cache.add(id_to_archive);
      if (itemCount % 1000 === 0) {
        saveCache(cache);
      }
    } catch (error) {
      console.error('Error processing dead feed:', error);
      console.error('Data that caused the error:', parsedData);
    }
  }

  await podcastIndexService.deadFeedsDownloadAndExtractCSV(resolveHandler);
  saveCache(cache);
};
