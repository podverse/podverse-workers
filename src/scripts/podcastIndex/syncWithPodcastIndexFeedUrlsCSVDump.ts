import { syncWithPodcastIndexFeedUrlsCSVDump } from "../../services/parser/podcastIndex"; 

;(async function () {
  try {
    const rootFilePath = process.argv[2]
    await syncWithPodcastIndexFeedUrlsCSVDump(rootFilePath || '')
  } catch (error) {
    console.log(error)
  }
})()
