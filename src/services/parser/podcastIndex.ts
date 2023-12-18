import axios from 'axios'
import csv from 'csvtojson'
import { Podcast, connectToDb, generateShortId, getAuthorityFeedUrlByPodcastIndexId, getConnection, getFeedUrlByUrl, getPodcastByPodcastIndexId, getPodcastsByPodcastIndexIds, getRepository } from 'podverse-orm'
import { parserInstance } from '../../factories/parser'
import { config } from '../../config'
import { podcastIndexInstance } from '../../factories/podcastIndex'

// TODO: replace client: any with client: EntityManager
export async function createOrUpdatePodcastFromPodcastIndex(client: any, item: any) {
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
        [generateShortId(), itunesId, podcastIndexId, isPublic]
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
        [generateShortId(), isAuthority, url, existingPodcast.id]
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

/**
 * syncWithPodcastIndexFeedUrlsCSVDump
 *
 * Basically, this function parses a CSV file of feed URLs provided by Podcast Index,
 * then adds each feed URL to our database if it doesn't already exist,
 * and retires the previous feed URLs saved in our database for that podcast if any exist.
 *
 * Longer explanation...
 * This looks for a file named podcastIndexFeedUrlsDump.csv, then iterates through
 * every podcastIndexItem in the file, then retrieves all existing feedUrls in our database
 * that have a matching podcastIndexIds.
 *
 * When no feedUrl for that podcastIndexId exists, then creates a new feedUrl
 * using the podcastIndexItem's information.
 *
 * When a feedUrl for that podcastIndexId exists, then promote the item's new url
 * to be the authority feedUrl for that podcast, and demote any other feedUrls for that podcast.
 */
export const syncWithPodcastIndexFeedUrlsCSVDump = async (rootFilePath: string) => {
  await connectToDb()

  try {
    const csvFilePath = `${rootFilePath}/temp/podcastIndexFeedUrlsDump.csv`
    console.log('syncWithPodcastIndexFeedUrlsCSVDump csvFilePath', csvFilePath)
    const client = await getConnection().createEntityManager()
    await csv()
      .fromFile(csvFilePath)
      .subscribe((json) => {
        return new Promise<void>(async (resolve) => {
          await new Promise((r) => setTimeout(r, 25))
          try {
            await createOrUpdatePodcastFromPodcastIndex(client, json)
          } catch (error) {
            console.log('podcastIndex:syncWithPodcastIndexFeedUrlsCSVDump subscribe error', error)
          }

          resolve()
        })
      })
  } catch (error) {
    console.log('podcastIndex:syncWithPodcastIndexFeedUrlsCSVDump', error)
  }
}

type PodcastIndexDataFeed = {
  feedId: number
  feedUrl: string
}

/*
  This function determines if the feed.url returned by Podcast Index is not currently
  the authority feedUrl in our database. If it is not, then update our database to use
  the newer feed.url provided by Podcast Index.
*/
export const updateFeedUrlsIfNewAuthorityFeedUrlDetected = async (podcastIndexDataFeeds: PodcastIndexDataFeed[]) => {
  try {
    console.log('updateFeedUrlsIfNewAuthorityFeedUrlDetected', podcastIndexDataFeeds?.length)
    const client = await getConnection().createEntityManager()
    if (Array.isArray(podcastIndexDataFeeds)) {
      for (const podcastIndexDataFeed of podcastIndexDataFeeds) {
        try {
          if (podcastIndexDataFeed.feedId) {
            const currentFeedUrl = await getAuthorityFeedUrlByPodcastIndexId(podcastIndexDataFeed.feedId.toString())
            if (currentFeedUrl && currentFeedUrl.url !== podcastIndexDataFeed.feedUrl) {
              const podcastIndexFeed = {
                id: podcastIndexDataFeed.feedId,
                url: podcastIndexDataFeed.feedUrl
              }
              await createOrUpdatePodcastFromPodcastIndex(client, podcastIndexFeed)
            }
          }
        } catch (err) {
          console.log('updateFeedUrlsIfNewAuthorityFeedUrlDetected podcastIndexDataFeed', err)
        }
      }
    }
  } catch (err) {
    console.log('updateFeedUrlsIfNewAuthorityFeedUrlDetected err', err)
  }
}

export const hideDeadPodcasts = async (fileUrl?: string) => {
  const url = fileUrl ? fileUrl : 'https://public.podcastindex.org/podcastindex_dead_feeds.csv'

  const response = await axios({
    url,
    headers: {
      'Content-Type': 'text/csv'
    }
  })

  try {
    await csv({ noheader: true })
      .fromString(response.data)
      .subscribe((json) => {
        return new Promise<void>(async (resolve) => {
          await new Promise((r) => setTimeout(r, 5))
          try {
            if (json?.field1) {
              try {
                const podcast = await getPodcastByPodcastIndexId(json.field1)
                if (podcast.isPublic) {
                  const repository = getRepository(Podcast)
                  podcast.isPublic = false
                  await new Promise((resolve) => setTimeout(resolve, 100))
                  await repository.save(podcast)
                  console.log('feed hidden successfully!', json.field1, json.field2)
                }
              } catch (error: any) {
                if (error.message.indexOf('not found') === -1) {
                  console.log('error hiding podcast json', json)
                  console.log('error hiding podcast json error message:', error)
                } else {
                  // console.log('feed already hidden', json.field1, json.field2)
                }
              }
            }
          } catch (error) {
            console.log('podcastIndex:hideDeadPodcasts subscribe error', error)
          }

          resolve()
        })
      })
  } catch (error) {
    console.log('podcastIndex:hideDeadPodcasts', error)
  }

  console.log('hideDeadPodcasts finished')
}

// TODO: this is duplicated in podverse-api and should be removed somehow
export const addOrUpdatePodcastFromPodcastIndex = async (client: any, podcastIndexId: string) => {
  const podcastIndexPodcast = await podcastIndexInstance.getPodcastFromPodcastIndexById(podcastIndexId)
  const allowNonPublic = true
  await createOrUpdatePodcastFromPodcastIndex(client, podcastIndexPodcast.feed)
  const feedUrl = await getAuthorityFeedUrlByPodcastIndexId(podcastIndexId, allowNonPublic)

  try {
    await parserInstance.parseFeedUrl(feedUrl, allowNonPublic)
  } catch (error) {
    console.log('addOrUpdatePodcastFromPodcastIndex error', error)
  }
}
