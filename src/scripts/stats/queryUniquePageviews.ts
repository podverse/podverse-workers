import { StatsPagePaths, StatsTimeRanges, queryUniquePageviews } from "../../services/stats";

;(async function () {
  try {
    const pagePath = process.argv[2] as keyof typeof StatsPagePaths
    const timeRange = process.argv[3] as keyof typeof StatsTimeRanges
    queryUniquePageviews(pagePath, timeRange)
  } catch (error) {
    console.log(error)
  }
})()
