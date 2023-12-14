import { parseIntOrDefault } from "podverse-shared"

export const config = {
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    imageCloudFrontOrigin: process.env.AWS_IMAGE_CLOUDFRONT_ORIGIN || '',
    imageS3BucketName: process.env.AWS_IMAGE_S3_BUCKET_NAME || '',
    queueUrls: {
      feedsToParse: {
        liveQueueUrl: process.env.AWS_QUEUE_URLS_FEEDS_TO_PARSE_LIVE_QUEUE_URL  || '',
        priorityQueueUrl: process.env.AWS_QUEUE_URLS_FEEDS_TO_PARSE_PRIORITY_QUEUE_URL  || '',
        queueUrl: process.env.AWS_QUEUE_FEED_PARSER_URL || ''
      },
      selfManagedFeedsToParse: {
        queueUrl: process.env.AWS_QUEUE_SELF_MANAGED_FEED_PARSER_URL || ''
      }
    },
    region: process.env.AWS_REGION  || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  },
  google: {
    authToken: process.env.GOOGLE_AUTH_TOKEN || ''
  },
  imageShrinker: {
    imageSize: parseIntOrDefault(process.env.IMAGE_SHRINKER_IMAGE_SIZE, 800)
  },
  matomo: {
    baseUrl: process.env.MATOMO_BASE_URL || '',
    siteId: process.env.MATOMO_SITE_ID || '',
    authToken: process.env.MATOMO_AUTH_TOKEN || ''
  },
  podcastIndex: {
    authKey: process.env.PODCAST_INDEX_AUTH_KEY  || '',
    baseUrl: process.env.PODCAST_INDEX_BASE_URL  || '',
    secretKey: process.env.PODCAST_INDEX_SECRET_KEY  || '',
    newFeedsSinceTime: parseIntOrDefault(
      process.env.PODCAST_INDEX_NEW_FEEDS_SINCE_TIME, 43200000 /* half a day */
    ) as number
  },
  podping: {
    hiveAccount: process.env.PODPING_HIVE_ACCOUNT || '',
    hivePostingKey: process.env.PODPING_HIVE_POSTING_KEY || ''
  },
  userAgent: process.env.USER_AGENT  || ''
}
