import { addNewFeedsFromPodcastIndex } from "../../services/parser/podcastIndex";

;(async function () {
  try {
    await addNewFeedsFromPodcastIndex()
  } catch (error) {
    console.log(error)
  }
})()
