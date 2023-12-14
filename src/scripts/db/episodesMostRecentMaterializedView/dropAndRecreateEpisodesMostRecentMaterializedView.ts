import { connectToDb, dropAndRecreateEpisodesMostRecentMaterializedView } from 'podverse-orm'

;(async function () {
  try {
    await connectToDb()
    await dropAndRecreateEpisodesMostRecentMaterializedView()
  } catch (error) {
    console.log(error)
  }
})()
