import { connectToDb, updateRecentEpisodesTables } from 'podverse-orm'

;(async function () {
  try {
    await connectToDb()
    await updateRecentEpisodesTables()
  } catch (error) {
    console.log(error)
  }
})()
