import axios from 'axios'
import moment from 'moment'
import { connectToDb, getConnection } from 'podverse-orm'
import { generateQueryParams, offsetDate, splitDateIntoEqualIntervals } from 'podverse-shared'
import { config } from '../config'

const url = `${config.matomo.baseUrl}`

enum PagePaths {
  clips = 'clip',
  episodes = 'episode',
  podcasts = 'podcast',
  albums = 'album',
  tracks = 'track',
  channels = 'channel',
  videos = 'video'
}

enum StartDateOffset {
  // hour = -60,
  day = -1440,
  week = -10080,
  month = -43800,
  year = -525600
}

/*
  const TableNames = {
    clip: 'mediaRef',
    episode: 'episode',
    podcast: 'podcast',
    album: 'podcast',
    track: 'episode',
    channel: 'podcast',
    video: 'episode'
  }
*/

enum TimeRanges {
  // hour = 'pastHourTotalUniquePageviews',
  day = 'pastDayTotalUniquePageviews',
  week = 'pastWeekTotalUniquePageviews',
  month = 'pastMonthTotalUniquePageviews',
  year = 'pastYearTotalUniquePageviews',
  allTime = 'pastAllTimeTotalUniquePageviews'
}

const generateGetAllRelatedDataQueryString = (finalPagePath: string, timeRange) => {
  let queryString = 'pagePath: string, timeRange, tableName: string'

  if (finalPagePath === PagePaths.podcasts) {
    queryString = `
      SELECT p.id, p."${TimeRanges[timeRange]}"
      FROM "podcasts" p
      WHERE p."${TimeRanges[timeRange]}">0
      AND p."hasVideo" IS FALSE
      AND p."medium" = 'podcast';
    `
  } else if (finalPagePath === PagePaths.episodes) {
    queryString = `
      SELECT e.id, e."${TimeRanges[timeRange]}"
      FROM "episodes" e
      JOIN "podcasts" p ON p.id = e."podcastId"
      WHERE e."${TimeRanges[timeRange]}">0
      AND p."hasVideo" IS FALSE
      AND p."medium" = 'podcast';
    `
  } else if (finalPagePath === PagePaths.clips) {
    queryString = `
      SELECT id, "${TimeRanges[timeRange]}"
      FROM "mediaRefs"
      WHERE "${TimeRanges[timeRange]}">0
    `
  } else if (finalPagePath === PagePaths.albums) {
    queryString = `
      SELECT p.id, p."${TimeRanges[timeRange]}"
      FROM "podcasts" p
      WHERE p."${TimeRanges[timeRange]}">0
      AND p."hasVideo" IS FALSE
      AND p."medium" = 'music';
    `
  } else if (finalPagePath === PagePaths.tracks) {
    queryString = `
      SELECT e.id, e."${TimeRanges[timeRange]}"
      FROM "episodes" e
      JOIN "podcasts" p ON p.id = e."podcastId"
      WHERE e."${TimeRanges[timeRange]}">0
      AND p."hasVideo" IS FALSE
      AND p."medium" = 'music';
    `
  } else if (finalPagePath === PagePaths.channels) {
    queryString = `
      SELECT p.id, p."${TimeRanges[timeRange]}"
      FROM "podcasts" p
      WHERE "${TimeRanges[timeRange]}">0
      AND p."hasVideo" IS TRUE;
    `
  } else if (finalPagePath === PagePaths.videos) {
    queryString = `
      SELECT e.id, e."${TimeRanges[timeRange]}"
      FROM "episodes" e
      JOIN "podcasts" p ON p.id = e."podcastId"
      WHERE e."${TimeRanges[timeRange]}">0
      AND p."hasVideo" IS TRUE;
    `
  } else {
    throw new Error('generateAllRelatedDataQueryString: Failed to generate queryString')
  }

  return queryString
}

const generateResetToZeroQueryString = (finalPagePath: string, timeRange, id: string) => {
  let queryString = ''

  if (finalPagePath === PagePaths.podcasts) {
    queryString = `
      UPDATE "podcasts"
      SET "${TimeRanges[timeRange]}"=0
      WHERE id='${id}'
      AND "hasVideo" IS FALSE
      AND "medium" = 'podcast';
    `
  } else if (finalPagePath === PagePaths.episodes) {
    queryString = `
      UPDATE "episodes" e 
      SET "${TimeRanges[timeRange]}" = 0
      WHERE e.id = ${id}
      AND e."podcastId"
      IN (
        SELECT p.id
        FROM podcasts p
        WHERE e."podcastId" = p.id
        AND p."hasVideo" IS FALSE
        AND p."medium" = 'podcast'
      );
    `
  } else if (finalPagePath === PagePaths.clips) {
    queryString = `
      UPDATE "mediaRefs" m
      SET m."${TimeRanges[timeRange]}"=0
      WHERE m.id='${id}';
    `
  } else if (finalPagePath === PagePaths.albums) {
    queryString = `
      UPDATE "podcasts"
      SET "${TimeRanges[timeRange]}"=0
      WHERE id='${id}'
      AND "hasVideo" IS FALSE
      AND "medium" = 'music';
    `
  } else if (finalPagePath === PagePaths.tracks) {
    queryString = `
      UPDATE "episodes" e 
      SET "${TimeRanges[timeRange]}" = 0
      WHERE e.id = ${id}
      AND e."podcastId"
      IN (
        SELECT p.id
        FROM podcasts p
        WHERE e."podcastId" = p.id
        AND p."hasVideo" IS FALSE
        AND p."medium" = 'music'
      );
    `
  } else if (finalPagePath === PagePaths.channels) {
    queryString = `
      UPDATE "podcasts"
      SET "${TimeRanges[timeRange]}"=0
      WHERE id='${id}'
      AND "hasVideo" IS TRUE;
    `
  } else if (finalPagePath === PagePaths.videos) {
    queryString = `
      UPDATE "episodes" e 
      SET "${TimeRanges[timeRange]}" = 0
      WHERE e.id = ${id}
      AND e."podcastId"
      IN (
        SELECT p.id
        FROM podcasts p
        WHERE e."podcastId" = p.id
        AND p."hasVideo" IS TRUE
      );
  `
  } else {
    throw new Error('generateAllRelatedDataQueryString: Failed to generate queryString')
  }

  return queryString
}

const generateSetNewCountQuery = (finalPagePath: string, timeRange, id: string, sum_daily_nb_uniq_visitors = 0) => {
  let queryString = ''

  if (finalPagePath === PagePaths.podcasts) {
    queryString = `
      UPDATE "podcasts"
      SET "${TimeRanges[timeRange]}"=${sum_daily_nb_uniq_visitors}
      WHERE id='${id}'
      AND "hasVideo" IS FALSE
      AND "medium" = 'podcast';
    `
  } else if (finalPagePath === PagePaths.episodes) {
    queryString = `
      UPDATE "episodes" e 
      SET e."${TimeRanges[timeRange]}"=${sum_daily_nb_uniq_visitors}
      WHERE e.id = ${id}
      AND e."podcastId"
      IN (
        SELECT p.id
        FROM podcasts p
        WHERE e."podcastId" = p.id
        AND p."hasVideo" IS FALSE
        AND p."medium" = 'podcast'
      );
    `
  } else if (finalPagePath === PagePaths.clips) {
    queryString = `
      UPDATE "mediaRefs" m
      SET m."${TimeRanges[timeRange]}"=${sum_daily_nb_uniq_visitors}
      WHERE m.id='${id}';
    `
  } else if (finalPagePath === PagePaths.albums) {
    queryString = `
      UPDATE "podcasts"
      SET "${TimeRanges[timeRange]}"=${sum_daily_nb_uniq_visitors}
      WHERE id='${id}'
      AND "hasVideo" IS FALSE
      AND "medium" = 'music';
    `
  } else if (finalPagePath === PagePaths.tracks) {
    queryString = `
      UPDATE "episodes" e 
      SET e."${TimeRanges[timeRange]}"=${sum_daily_nb_uniq_visitors}
      WHERE e.id = ${id}
      AND e."podcastId"
      IN (
        SELECT p.id
        FROM podcasts p
        WHERE e."podcastId" = p.id
        AND p."hasVideo" IS FALSE
        AND p."medium" = 'music'
      );
    `
  } else if (finalPagePath === PagePaths.channels) {
    queryString = `
      UPDATE "podcasts"
      SET "${TimeRanges[timeRange]}"=${sum_daily_nb_uniq_visitors}
      WHERE id='${id}'
      AND "hasVideo" IS TRUE;
    `
  } else if (finalPagePath === PagePaths.videos) {
    queryString = `
      UPDATE "episodes" e 
      SET e."${TimeRanges[timeRange]}"=${sum_daily_nb_uniq_visitors}
      WHERE e.id = ${id}
      AND e."podcastId"
      IN (
        SELECT p.id
        FROM podcasts p
        WHERE e."podcastId" = p.id
        AND p."hasVideo" IS TRUE
      );
    `
  } else {
    throw new Error('generateSetNewCountQuery: Failed to generate queryString')
  }

  return queryString
}

const savePageviewsToDatabase = async (finalPagePath: string, timeRange, data) => {
  await connectToDb()

  const matomoDataRows = data
  console.log('savePageviewsToDatabase')
  console.log('finalPagePath', finalPagePath)
  console.log('timeRange', timeRange)
  console.log('matomoDataRows.length', matomoDataRows.length)
  console.log('TimeRange', TimeRanges[timeRange])

  /*
    The Matomo stats endpoint will only return data for pages that have a view in the past X days,
    so we need to first set all of the table rows with values > 0 back to 0,
    before writing the Matomo data to the table.
  */

  const getTableRowsWithStatsData = generateGetAllRelatedDataQueryString(finalPagePath, timeRange)
  const tableRowsWithStatsData = await getConnection().createEntityManager().query(getTableRowsWithStatsData)

  for (const row of tableRowsWithStatsData) {
    try {
      const rawSQLUpdate = generateResetToZeroQueryString(finalPagePath, timeRange, row.id)
      await getConnection().createEntityManager().query(rawSQLUpdate)
    } catch (err) {
      console.log('tableRowsWithStatsData err', err)
      console.log('tableRowsWithStatsData err row', row)
    }
  }

  for (const row of matomoDataRows) {
    try {
      const label = row.label

      // remove all characters in the url path before the id, then put in an array
      const idStartIndex = label.indexOf(`${finalPagePath}/`) + (finalPagePath.length + 1)
      const id = label.substr(idStartIndex)

      // max length of ids = 14
      if (id.length > 14) {
        console.log('id too long!', id)
        continue
      }

      const sum_daily_nb_uniq_visitors = row.sum_daily_nb_uniq_visitors

      if (id) {
        const rawSQLUpdate = generateSetNewCountQuery(finalPagePath, timeRange, id, sum_daily_nb_uniq_visitors)
        await getConnection().createEntityManager().query(rawSQLUpdate)
      }
    } catch (err) {
      console.log('row err', err)
      console.log('row', row)
    }
  }
}

export const queryUniquePageviews = async (pagePath: string, timeRange) => {
  const finalPagePath = PagePaths[pagePath]
  const startDateOffset = parseInt(StartDateOffset[timeRange], 10)

  if (!Object.keys(PagePaths).includes(pagePath)) {
    console.log('A valid pagePath must be provided in the first parameter.')
    console.log('Valid options are: podcasts, episodes, clips, albums, tracks, channels, videos')
    return
  }

  if (!Object.keys(TimeRanges).includes(timeRange)) {
    console.log('A valid timeRange must be provided in the second parameter.')
    console.log('Valid options are: day, week, month, year, allTime')
    return
  }

  const startDate = new Date(timeRange === 'allTime' ? '2017-01-01' : offsetDate(startDateOffset))
  const endDate = new Date(offsetDate())

  const numberOfIntervals = ['allTime'].includes(timeRange) ? 60 : ['year'].includes(timeRange) ? 12 : 1
  const dateIntervals = splitDateIntoEqualIntervals(startDate, endDate, numberOfIntervals)
  let data: any[] = []

  for (const dateInterval of dateIntervals) {
    const response: any = await queryMatomoData(
      moment(dateInterval.start).format('YYYY-MM-DD'),
      moment(dateInterval.end).format('YYYY-MM-DD'),
      finalPagePath
    )
    data = data.concat(response.data)
  }

  /*
    Currently there are some invalid page values in our Matomo data
    that get there because of custom RSS feeds. For those pages,
    the url will look like
    https://podverse.fm/podcast/https://some.podcast.com/something/audiofile.mp3
    Since the id for podcast/episode/clip should be limited to 14 characters,
    this code is duck-typing to filter out urls that have more than
    14 characters in the path parameter.
  */

  const filterCustomFeedUrls = (data: any[], limit: number) => {
    return data.filter((x) => x.url.length <= limit)
  }

  const podcastLimit = 42 // https://podverse.fm/podcast/12345678901234
  const episodeLimit = 42 // https://podverse.fm/episode/12345678901234
  const clipLimit = 39 // https://podverse.fm/clip/12345678901234
  const albumLimit = 40 // https://podverse.fm/album/12345678901234
  const trackLimit = 40 // https://podverse.fm/track/12345678901234
  const channelLimit = 42 // https://podverse.fm/channel/12345678901234
  const videoLimit = 40 // https://podverse.fm/video/12345678901234

  let filteredData: any[] = []
  if (finalPagePath === PagePaths.podcasts) {
    filteredData = filterCustomFeedUrls(data, podcastLimit)
  } else if (finalPagePath === PagePaths.episodes) {
    filteredData = filterCustomFeedUrls(data, episodeLimit)
  } else if (finalPagePath === PagePaths.clips) {
    filteredData = filterCustomFeedUrls(data, clipLimit)
  } else if (finalPagePath === PagePaths.albums) {
    filteredData = filterCustomFeedUrls(data, albumLimit)
  } else if (finalPagePath === PagePaths.tracks) {
    filteredData = filterCustomFeedUrls(data, trackLimit)
  } else if (finalPagePath === PagePaths.channels) {
    filteredData = filterCustomFeedUrls(data, channelLimit)
  } else if (finalPagePath === PagePaths.videos) {
    filteredData = filterCustomFeedUrls(data, videoLimit)
  }

  await savePageviewsToDatabase(finalPagePath, timeRange, filteredData)
}

/*
  In order for queryMatomoData to return data, a corresponding "segment" must be created
  in our Matomo instance.
  For example:
  album page segment
  Page URL -> Contains -> /album/
*/

export const queryMatomoData = async (startDate, endDate, segmentPageUrl) => {
  if (!config.matomo.authToken || !config.matomo.baseUrl || !config.matomo.siteId) {
    throw new Error('Matomo config variables missing.')
  }

  const batchPayload = {
    token_auth: config.matomo.authToken,
    module: 'API',
    method: 'Actions.getPageUrls',
    idSite: config.matomo.siteId,
    period: 'range',
    date: `${startDate},${endDate}`,
    format: 'json',
    filter_limit: '-1',
    flat: '1',
    segment: `pageUrl%3D@%25252F${segmentPageUrl}%25252F`
  }

  const urlWithParams = `${url}?${generateQueryParams(batchPayload)}`

  try {
    return axios({
      url: urlWithParams,
      method: 'GET',
      headers: {
        'User-Agent': config.userAgent
      }
    })
  } catch (error) {
    console.log('queryMatomoData error:', error)
    return []
  }
}
