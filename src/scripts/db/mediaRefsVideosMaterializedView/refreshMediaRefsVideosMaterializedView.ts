import { connectToDb, refreshMediaRefsVideosMaterializedView } from 'podverse-orm'

;(async function () {
  try {
    await connectToDb()
    await refreshMediaRefsVideosMaterializedView()
  } catch (error) {
    console.log(error)
  }
})()
