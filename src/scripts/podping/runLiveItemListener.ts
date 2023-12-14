import { connectToDb } from 'podverse-orm'
import { runLiveItemListener } from '../../services/podping'

;(async function () {
  await connectToDb()

  try {
    await runLiveItemListener()
  } catch (error) {
    console.log(error)
  }
})()
