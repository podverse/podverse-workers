import { connectToDb } from 'podverse-orm'
import { hideDeadPodcasts } from '../../services/parser/podcastIndex'; 

;(async function () {
  try {
    const fileUrl = process.argv.length > 2 ? process.argv[2] : ''

    await connectToDb()
    await hideDeadPodcasts(fileUrl)
  } catch (error) {
    console.log(error)
  }
  return
})()
