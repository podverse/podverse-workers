import { connectToDb } from 'podverse-orm'
import { podcastIndexInstance } from '../../factories/podcastIndex';
import { updateHasPodcastIndexValueTags } from '../../services/parser/podcastIndex';

(async function () {
  await connectToDb()

  try {
    const podcastIndexIds = await podcastIndexInstance.getValueTagEnabledPodcastIdsFromPI()
    await updateHasPodcastIndexValueTags(podcastIndexIds)
  } catch (error) {
    console.log(error)
  }
})()
