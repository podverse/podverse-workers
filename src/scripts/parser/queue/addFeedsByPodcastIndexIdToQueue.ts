import { connectToDb } from 'podverse-orm'
import { addNewFeedsByPodcastIndexIdThenSendToQueue } from '../../../services/parser/queue'
;(async function () {
  try {
    const podcastIndexIdsString = process.argv.length > 2 ? process.argv[2] : ''

    if (!podcastIndexIdsString) {
      console.log('Provide a comma delimited string of podcastIndexIds as a parameter.')
      return
    }

    const podcastIndexIds = podcastIndexIdsString.split(',')
    const connection = await connectToDb()

    if (connection && connection.isConnected) {
      console.log('should be connected')
      await addNewFeedsByPodcastIndexIdThenSendToQueue(connection, podcastIndexIds)
    } else {
      console.log('is not connected')
    }
  } catch (error) {
    console.log(error)
  }
})()
