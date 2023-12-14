import { connectToDb, refreshEpisodesMostRecentMaterializedView } from 'podverse-orm'

;(async function () {
  try {
    await connectToDb()
    await refreshEpisodesMostRecentMaterializedView()
  } catch (error) {
    console.log(error)
  }
})()
