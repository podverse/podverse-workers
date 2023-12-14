import { addRecentlyUpdatedFeedUrlsToPriorityQueue } from "../../../services/parser/queue";

;(async function () {
  try {
    const sinceTime = (process.argv.length > 2 ? process.argv[2] : '') as any

    await addRecentlyUpdatedFeedUrlsToPriorityQueue(sinceTime)
  } catch (error) {
    console.log(error)
  }
})()
