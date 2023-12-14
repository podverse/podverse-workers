import { Podcast, connectToDb, getConnection, getFeedUrlByUrl, getPodcastsByPodcastIndexIds, getRepository } from 'podverse-orm'
import shortid from 'shortid'
import { parserInstance } from '../../factories/parser'
import { config } from '../../config'
import { podcastIndexInstance } from '../../factories/podcastIndex'

const getPodcastByPodcastIndexId = async (client, podcastIndexId) => {
  let podcasts = [] as any

  if (podcastIndexId) {
    podcasts = await client.query(
      `
      SELECT "authorityId", "podcastIndexId", id, title
      FROM podcasts
      WHERE "podcastIndexId"=$1;
    `,
      [podcastIndexId]
    )
  }

  return podcasts[0]
}

export async function createOrUpdatePodcastFromPodcastIndex(client, item) {
  console.log('-----------------------------------')
  console.log('createOrUpdatePodcastFromPodcastIndex')

  if (!item || !item.url || !item.id) {
    console.log('no item found')
  } else {
    const url = item.url
    const podcastIndexId = item.id
    const itunesId = parseInt(item.itunes_id) ? item.itunes_id : null

    console.log('feed url', url, podcastIndexId, itunesId)

    let existingPodcast = await getPodcastByPodcastIndexId(client, podcastIndexId)

    if (!existingPodcast) {
      console.log('podcast does not already exist')
      const isPublic = true

      await client.query(
        `
        INSERT INTO podcasts (id, "authorityId", "podcastIndexId", "isPublic")
        VALUES ($1, $2, $3, $4);
      `,
        [shortid(), itunesId, podcastIndexId, isPublic]
      )

      existingPodcast = await getPodcastByPodcastIndexId(client, podcastIndexId)
    } else {
      const setSQLCommand = itunesId
        ? `SET ("podcastIndexId", "authorityId") = (${podcastIndexId}, ${itunesId})`
        : `SET "podcastIndexId" = ${podcastIndexId}`
      await client.query(
        `
        UPDATE "podcasts"
        ${setSQLCommand}
        WHERE "podcastIndexId"=$1
      `,
        [podcastIndexId.toString()]
      )
      console.log('updatedPodcast id: ', existingPodcast.id)
      console.log('updatedPodcast podcastIndexId: ', podcastIndexId)
      console.log('updatedPodcast itunesId: ', itunesId)
    }

    const existingFeedUrls = await client.query(
      `
      SELECT id, url
      FROM "feedUrls"
      WHERE "podcastId"=$1
    `,
      [existingPodcast.id]
    )

    /*
      In case the feed URL already exists in our system, but is assigned to another podcastId,
      get the feed URL for the other podcastId, so it can be assigned to the new podcastId.
    */
    const existingFeedUrlsByFeedUrl = await client.query(
      `
        SELECT id, url
        FROM "feedUrls"
        WHERE "url"=$1
      `,
      [url]
    )

    const combinedExistingFeedUrls = [...existingFeedUrls, ...existingFeedUrlsByFeedUrl]

    console.log('existingFeedUrls count', existingFeedUrls.length)

    for (const existingFeedUrl of combinedExistingFeedUrls) {
      console.log('existingFeedUrl url / id', existingFeedUrl.url, existingFeedUrl.id)

      const isMatchingFeedUrl = url === existingFeedUrl.url

      await client.query(
        `
        UPDATE "feedUrls"
        SET ("isAuthority", "podcastId") = (${isMatchingFeedUrl ? 'TRUE' : 'NULL'}, '${existingPodcast.id}')
        WHERE id=$1
      `,
        [existingFeedUrl.id]
      )
    }

    const updatedFeedUrlResults = await client.query(
      `
      SELECT id, url
      FROM "feedUrls"
      WHERE url=$1
    `,
      [url]
    )
    const updatedFeedUrl = updatedFeedUrlResults[0]

    if (updatedFeedUrl) {
      console.log('updatedFeedUrl already exists url / id', updatedFeedUrl.url, updatedFeedUrl.id)
    } else {
      console.log('updatedFeedUrl does not exist url / id')
      const isAuthority = true
      await client.query(
        `
        INSERT INTO "feedUrls" (id, "isAuthority", "url", "podcastId")
        VALUES ($1, $2, $3, $4);
      `,
        [shortid(), isAuthority, url, existingPodcast.id]
      )
    }
  }
  console.log('*** finished entry')
}

/**
 * addNewFeedsFromPodcastIndex
 *
 * Request a list of all podcast feeds that have been added
 * within the past X minutes from Podcast Index, then add
 * that feed to our database if it doesn't already exist.
 */
export const addNewFeedsFromPodcastIndex = async () => {
  console.log('addNewFeedsFromPodcastIndex')
  await connectToDb()
  const client = await getConnection().createEntityManager()
  try {
    const response = await getNewFeeds()
    const newFeeds = response.feeds
    console.log('total newFeeds count', newFeeds.length)
    for (const item of newFeeds) {
      try {
        await createOrUpdatePodcastFromPodcastIndex(client, item)
        const feedUrl = await getFeedUrlByUrl(item.url)
        await parserInstance.parseFeedUrl(feedUrl)
      } catch (error) {
        console.log('addNewFeedsFromPodcastIndex item', item)
        console.log('addNewFeedsFromPodcastIndex error', error)
      }
    }
  } catch (error) {
    console.log('addNewFeedsFromPodcastIndex', error)
  }
}

const getNewFeeds = async () => {
  const currentTime = new Date().getTime()

  // add 5 seconds to the query to prevent podcasts falling through the cracks between requests
  const offset = 5000
  const startRangeTime = Math.floor((currentTime - (config.podcastIndex.newFeedsSinceTime + offset)) / 1000)

  console.log('currentTime----', currentTime)
  console.log('startRangeTime-', startRangeTime)
  const url = `${config.podcastIndex.baseUrl}/recent/newfeeds?since=${startRangeTime}&max=1000`
  console.log('url------------', url)
  const response = await podcastIndexInstance.podcastIndexAPIRequest(url)

  return response && response.data
}

export const updateHasPodcastIndexValueTags = async (podcastIndexIds: number[]) => {
  console.log('updateHasPodcastIndexValueTags', podcastIndexIds.length)
  const repository = getRepository(Podcast)

  // First reset all the podcasts with hasPodcastIndexValueTag=true already to false.
  const podcastsToResetValueTag = await repository.find({
    where: {
      hasPodcastIndexValueTag: true
    }
  }) as Podcast[]
  console.log('podcastsToResetValueTag', podcastsToResetValueTag.length)

  const podcastsToReparse = podcastsToResetValueTag.filter((podcast: Podcast) => {
    return !podcastIndexIds.includes(parseInt(podcast.podcastIndexId || '', 10))
  })
  console.log('podcastsToReparse', podcastsToReparse.length)

  const newPodcastsToReset = podcastsToResetValueTag.map((podcast) => {
    podcast.hasPodcastIndexValueTag = false
    return podcast
  })
  console.log('newPodcastsToReset', newPodcastsToReset.length)

  await repository.save(newPodcastsToReset, { chunk: 400 })

  const podcastsToUpdate = await getPodcastsByPodcastIndexIds(podcastIndexIds)
  console.log('podcastsToUpdate', podcastsToUpdate.length)

  const newPodcastsToUpdate = podcastsToUpdate.map((podcast) => {
    podcast.hasPodcastIndexValueTag = true
    return podcast
  })
  console.log('newPodcastsToUpdate', newPodcastsToUpdate.length)

  await repository.save(newPodcastsToUpdate, { chunk: 400 })

  console.log('newPodcastsToUpdate saved')

  const podcastsToReparseIds = podcastsToReparse.map((podcast) => podcast.id)
  console.log('parseFeedUrlsByPodcastIds', podcastsToReparseIds)

  await parserInstance.parseFeedUrlsByPodcastIds(podcastsToReparseIds)

  console.log('updateHasPodcastIndexValueTags finished')
}
