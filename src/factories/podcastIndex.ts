import { PodcastIndexService } from 'podverse-external-services'

export const podcastIndexInstance = new PodcastIndexService({
  authKey: '',
  baseUrl: 'https://api.podcastindex.org/api/1.0',
  secretKey: '',
  userAgent: 'Podverse/Feed Parser'
})
