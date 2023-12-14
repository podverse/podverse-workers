import { connectToDb, FeedUrl, getFeedUrl, getFeedUrlsByPodcastIndexIds, getRepository, Podcast } from "podverse-orm"
import { chunkArray } from "podverse-shared"
import { config } from '../../config'
import { awsSQSInstance } from "../../factories/aws"
import { parserInstance } from '../../factories/parser'
import { podcastIndexInstance } from '../../factories/podcastIndex'
import { createOrUpdatePodcastFromPodcastIndex, updateFeedUrlsIfNewAuthorityFeedUrlDetected } from './podcastIndex'

export const addNewFeedsByPodcastIndexIdThenSendToQueue = async (client: any, podcastIndexIds: string[]) => {
  for (const podcastIndexId of podcastIndexIds) {
    try {
      const podcastIndexItem = await podcastIndexInstance.getPodcastFromPodcastIndexById(podcastIndexId)
      if (podcastIndexItem?.feed) {
        await createOrUpdatePodcastFromPodcastIndex(client, podcastIndexItem.feed)
      }
    } catch (error) {
      console.log('addNewFeedsByPodcastIndexIdThenSendToQueue error', error)
    }
  }

  await addFeedsToQueueForParsingByPodcastIndexId(podcastIndexIds)
}

// TODO: replace any
const sendFeedUrlsToQueue = async (feedUrls: FeedUrl[], queueUrl: string, forceParsing: boolean, cacheBust: boolean) => {
  const attributes: any[] = []

  for (const feedUrl of feedUrls) {
    const attribute = generateFeedMessageAttributes(feedUrl, {}, forceParsing, cacheBust) as never
    attributes.push(attribute)
  }

  const entries: any[] = []
  for (const [index, key] of Array.from(attributes.entries())) {
    const entry = {
      Id: String(index),
      MessageAttributes: key,
      MessageBody: 'aws sqs requires a message body - podverse rules'
    } as never

    entries.push(entry)
  }

  const entryChunks = chunkArray(entries)
  const messagePromises = [] as any
  for (const entryChunk of entryChunks) {
    const chunkParams = {
      Entries: entryChunk,
      QueueUrl: queueUrl
    }

    messagePromises.push(awsSQSInstance.sendMessageBatch(chunkParams).promise())
  }

  Promise.all(messagePromises).catch((error) => {
    console.error('addAllFeedsToQueue: sqs.sendMessageBatch error', error)
  })
}

// TODO: replace any
export const generateFeedMessageAttributes = (
  feedUrl: FeedUrl,
  error = {} as any,
  forceReparsing: boolean,
  cacheBust: boolean
) => {
  return {
    id: {
      DataType: 'String',
      StringValue: feedUrl.id
    },
    url: {
      DataType: 'String',
      StringValue: feedUrl.url
    },
    ...(feedUrl.podcast && feedUrl.podcast.id
      ? {
          podcastId: {
            DataType: 'String',
            StringValue: feedUrl.podcast && feedUrl.podcast.id
          }
        }
      : {}),
    ...(feedUrl.podcast && feedUrl.podcast.title
      ? {
          podcastTitle: {
            DataType: 'String',
            StringValue: feedUrl.podcast && feedUrl.podcast.title
          }
        }
      : {}),
    ...(forceReparsing
      ? {
          forceReparsing: {
            DataType: 'String',
            StringValue: 'TRUE'
          }
        }
      : {}),
    ...(cacheBust
      ? {
          cacheBust: {
            DataType: 'String',
            StringValue: 'TRUE'
          }
        }
      : {}),
    ...(error && error.message
      ? {
          errorMessage: {
            DataType: 'String',
            StringValue: error.message
          }
        }
      : {})
  }
}

export const parseFeedUrlsFromQueue = async (queueUrl: string, restartTimeOut: number) => {
  const shouldContinue = await parseNextFeedFromQueue(queueUrl)

  if (shouldContinue) {
    await parseFeedUrlsFromQueue(queueUrl, restartTimeOut)
  } else if (restartTimeOut) {
    setTimeout(() => {
      parseFeedUrlsFromQueue(queueUrl, restartTimeOut)
    }, restartTimeOut)
  }
}

const parseNextFeedFromQueue = async (queueUrl: string) => {
  const message = await awsSQSInstance.receiveMessageFromQueue(queueUrl)

  if (!message) {
    return false
  }

  const feedUrlMsg = extractFeedMessage(message)

  try {
    const feedUrl = await getFeedUrl(feedUrlMsg.id)

    if (feedUrl) {
      try {
        await parserInstance.parseFeedUrl(feedUrl)
      } catch (error: any) {
        console.log('error parseFeedUrl feedUrl', feedUrl.id, feedUrl.url)
        console.log('error', error)
        throw error
      }
    } else {
      try {
        await parserInstance.parseFeedUrl(feedUrlMsg)
      } catch (error: any) {
        console.log('error parseFeedUrl feedUrlMsg', feedUrlMsg)
        console.log('error', error)
        throw error
      }
    }
  } catch (error: any) {
    // TODO: handle error
    console.log('parseNextFeedFromQueue error', error)
  }

  await awsSQSInstance.deleteMessage(queueUrl, feedUrlMsg.receiptHandle)

  return true
}

// TODO: replace any
const extractFeedMessage = (message: any) => {
  const attrs = message.MessageAttributes
  return {
    id: attrs.id.StringValue,
    url: attrs.url.StringValue,
    ...(attrs.podcastId && attrs.podcastTitle
      ? {
          podcast: {
            id: attrs.podcastId.StringValue,
            title: attrs.podcastTitle.StringValue
          }
        }
      : {}),
    ...(attrs.forceReparsing ? { forceReparsing: true } : {}),
    ...(attrs.cacheBust ? { cacheBust: true } : {}),
    receiptHandle: message.ReceiptHandle
  } as any
}

export const addFeedsToQueueByPriority = async (parsingPriority: number, offset = 0) => {
  await connectToDb()

  try {
    const feedUrlRepo = getRepository(FeedUrl)

    const recursivelySendFeedUrls = async (i: number) => {
      console.log('parsing:', i * 1000)

      const feedUrls = await feedUrlRepo
        .createQueryBuilder('feedUrl')
        .select('feedUrl.id')
        .addSelect('feedUrl.url')
        .innerJoinAndSelect(
          'feedUrl.podcast',
          'podcast',
          'podcast.isPublic = :isPublic AND podcast."parsingPriority" >= :parsingPriority',
          { isPublic: true, parsingPriority }
        )
        .where('feedUrl.isAuthority = true AND feedUrl.podcast IS NOT NULL')
        .offset(i * 1000)
        .limit(1000)
        .getMany() as FeedUrl[]

      const forceReparsing = true
      const cacheBust = false
      await sendFeedUrlsToQueue(feedUrls, config.aws.queueUrls.selfManagedFeedsToParse.queueUrl, forceReparsing, cacheBust)

      if (feedUrls.length === 1000) {
        recursivelySendFeedUrls(i + 1)
      }
    }

    await recursivelySendFeedUrls(offset)
  } catch (error) {
    console.log('queue:addFeedsToQueueByPriority', error)
  }
}

export const addFeedsToQueueForParsingByPodcastIndexId = async (podcastIndexIds: string[], queueType = 'priority') => {
  try {
    // connect to database
    connectToDb()

    if (!podcastIndexIds || podcastIndexIds.length === 0) {
      throw new Error('No podcastIndexIds provided.')
    }

    const feedUrls = await getFeedUrlsByPodcastIndexIds(podcastIndexIds)

    console.log('Total feedUrls found:', feedUrls.length)

    const queueUrl = queueType === 'live'
      ? config.aws.queueUrls.feedsToParse.liveQueueUrl
      : config.aws.queueUrls.feedsToParse.priorityQueueUrl

    const forceReparsing = queueType === 'live'
    const cacheBust = queueType === 'live'
    await sendFeedUrlsToQueue(feedUrls, queueUrl, forceReparsing, cacheBust)

    const podcasts: Podcast[] = []
    const newLastFoundInPodcastIndex = new Date()
    for (const feedUrl of feedUrls) {
      feedUrl.podcast.lastFoundInPodcastIndex = newLastFoundInPodcastIndex
      podcasts.push(feedUrl.podcast)
    }
    const podcastRepo = getRepository(Podcast)
    await podcastRepo.save(podcasts)
  } catch (error) {
    console.log('queue:addFeedsToQueueForParsingByPodcastIndexId', error)
  }
}

/**
 * addRecentlyUpdatedFeedUrlsToPriorityQueue
 *
 * Request a list of all podcast feeds that have been updated
 * within the past X time from Podcast Index, then add
 * the feeds that have a matching podcastIndexId in our database
 * to the queue for parsing.
 * sinceTime = epoch time to start from in seconds
 */
export const addRecentlyUpdatedFeedUrlsToPriorityQueue = async (sinceTime?: number) => {
  try {
    await connectToDb()

    /* If no sinceTime provided, get all updated feeds from the past hour */
    if (!sinceTime) {
      sinceTime = Math.round(Date.now() / 1000) - 3600
    }
    const recentlyUpdatedFeeds = await getRecentlyUpdatedDataRecursively([], sinceTime)
    console.log('total recentlyUpdatedFeeds count', recentlyUpdatedFeeds.length)

    await updateFeedUrlsIfNewAuthorityFeedUrlDetected(recentlyUpdatedFeeds)

    const recentlyUpdatedPodcastIndexIds = [] as any[]
    for (const item of recentlyUpdatedFeeds) {
      const { feedId } = item
      if (feedId) {
        recentlyUpdatedPodcastIndexIds.push(feedId)
      }
    }

    // TODO: THIS TAKES A VERY LONG TIME TO COMPLETE,
    // AND IS ARBITRARILY LIMITED TO 10000...
    // const uniquePodcastIndexIds = [...new Set(recentlyUpdatedPodcastIndexIds)].slice(0, 10000)

    // console.log('unique recentlyUpdatedPodcastIndexIds count', uniquePodcastIndexIds.length)

    // Send the feedUrls with matching podcastIndexIds found in our database to
    // the priority parsing queue for immediate parsing.
    if (recentlyUpdatedPodcastIndexIds.length > 0) {
      await addFeedsToQueueForParsingByPodcastIndexId(recentlyUpdatedPodcastIndexIds)
    }
  } catch (error) {
    console.log('addRecentlyUpdatedFeedUrlsToPriorityQueue', error)
  }
}

const getRecentlyUpdatedDataRecursively = async (accumulatedFeedData: any[] = [], since?: number): Promise<any[]> => {
  console.log('getRecentlyUpdatedDataRecursively')
  console.log('accumulatedFeedData.length', accumulatedFeedData.length)
  const currentTime = Math.floor(Date.now() / 1000)
  const axiosResponseData = await getRecentlyUpdatedData(since)
  const { data, itemCount, nextSince } = axiosResponseData
  console.log('itemCount', itemCount)
  console.log('since', since)
  console.log('nextSince', nextSince)
  const { feeds } = data
  console.log('feeds', feeds.length)
  accumulatedFeedData = [...accumulatedFeedData, ...feeds]
  console.log('accumulatedFeedData', accumulatedFeedData.length)
  if (itemCount >= 5000) {
    const timeRemainingSince = nextSince - currentTime
    console.log('timeRemainingSince', timeRemainingSince)
    return getRecentlyUpdatedDataRecursively(accumulatedFeedData, timeRemainingSince)
  } else {
    console.log('return final data', accumulatedFeedData.length)
    return accumulatedFeedData
  }
}

/* since = in seconds */
const getRecentlyUpdatedData = async (since?: number) => {
  let url = `${config.podcastIndex.baseUrl}/recent/data?max=5000`
  url += `&since=${since ? since : -1800}`
  const response = await podcastIndexInstance.podcastIndexAPIRequest(url)
  return response && response.data
}
