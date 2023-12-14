import { connectToDb } from 'podverse-orm'
import { parseFeedUrlsFromQueue } from '../../../services/parser/queue';
import { config } from '../../../config';

;(async function () {
  const connectToDbAndRunParser = async () => {
    try {
      if (process.argv.length <= 2) {
        console.log('The restartTimeout parameter is required.')
        console.log('Optionally provide a queueOverride parameter.')
        return
      }

      let queueUrl = config.aws.queueUrls.feedsToParse.queueUrl
      const restartTimeOut = process.argv.length > 2 ? parseInt(process.argv[2], 10) : 900000 // default 15 minutes
      const queueOverride = process.argv.length > 3 ? process.argv[3] : ''

      if (queueOverride === 'priority') {
        queueUrl = config.aws.queueUrls.feedsToParse.priorityQueueUrl
      } else if (queueOverride === 'live') {
        queueUrl = config.aws.queueUrls.feedsToParse.liveQueueUrl
      } else if (queueOverride === 'selfManaged') {
        queueUrl = config.aws.queueUrls.selfManagedFeedsToParse.queueUrl
      }

      console.log('should connect')
      const connection = await connectToDb()

      if (connection && connection.isConnected) {
        console.log('should be connected')
        await parseFeedUrlsFromQueue(queueUrl, restartTimeOut)
      } else {
        console.log('is not connected')
        setTimeout(() => {
          connectToDbAndRunParser()
        }, 20000)
      }
    } catch (error) {
      console.log(error)
    }
  }

  connectToDbAndRunParser()
})()
