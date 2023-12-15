import { dockerCommand } from 'docker-cli-js'
import { FeedUrl, getFeedUrlByUrl } from 'podverse-orm'
import { logPerformance, _logEnd, _logStart } from 'podverse-shared'
import ws from 'ws'
import { config } from '../config'
import { addFeedsToQueueForParsingByPodcastIndexId } from './parser/queue'

/*
  Run startup functions one time in the background.
  This should only be run in prod, or when you're sure you need it in development.
*/
export const podpingStartup = async () => {
  if (process.env.NODE_ENV === 'production') {
    await pullPodpingImage()
  }
}

export const pullPodpingImage = async () => {
  const options = {
    machineName: undefined, // uses local docker
    currentWorkingDirectory: '/usr/bin', // uses current working directory
    echo: true, // echo command output to stdout/stderr
    env: undefined,
    stdin: undefined
  }

  await dockerCommand(`pull docker.io/podcastindexorg/podping-hivewriter:1.2.9`, options)
}

export const sendPodpingLiveStatusUpdate = async (validatedUrl: string, status: string) => {
  const options = {
    machineName: undefined, // uses local docker
    currentWorkingDirectory: '/usr/bin', // uses current working directory
    echo: true, // echo command output to stdout/stderr
    env: undefined,
    stdin: undefined
  }

  await dockerCommand(
    `run --rm --storage-driver=vfs -e PODPING_HIVE_ACCOUNT=${config.podping.hiveAccount} -e PODPING_HIVE_POSTING_KEY=${config.podping.hivePostingKey} docker.io/podcastindexorg/podping-hivewriter --ignore-config-updates --no-sanity-check --reason ${status} write ${validatedUrl}`,
    options
  )
}

export const runLiveItemListener = () => {
  logPerformance('starting runLiveItemListener', _logStart)

  /*
    Run an interval to keep the node script running forever.
  */
  setInterval(() => {
    logPerformance('runLiveItemListener interval', _logStart)
  }, 100000000)

  let openedSocket: boolean | null = null
  const timeInterval = 5000
  const url = 'wss://api.livewire.io/ws/podping'

  let connectionIdCount = 0
  const hiveBlocksHandled: { [key: string]: boolean } = {}

  function connect() {
    const client = new ws(url)
    return new Promise((resolve, reject) => {
      logPerformance('client try to connect...', _logStart)

      let connectionId = connectionIdCount

      client.on('open', () => {
        connectionId = connectionIdCount + 1
        connectionIdCount++
        logPerformance(`WEBSOCKET_OPEN: client connected to server at ${url}, connectionId: ${connectionId}`, _logStart)
        openedSocket = true
        resolve(openedSocket)
      })

      // TODO: remove any
      client.on('message', async function message(data: any) {
        try {
          const msg = JSON.parse(data)

          // If the hiveBlock was already processed by our listener, then skip the message.
          if (hiveBlocksHandled[msg.n]) return

          const prodPodpingLiveIdRegex = new RegExp('^pp_(.*)_(live|liveEnd)$', 'i')

          if (msg.t === 'podping') {
            hiveBlocksHandled[msg.n] = true
            for (const p of msg.p) {
              if (
                prodPodpingLiveIdRegex.test(p.i) &&
                p.p.reason &&
                (p.p.reason.toLowerCase() === 'live' || p.p.reason.toLowerCase() === 'liveend')
              ) {
                logPerformance(
                  `p.p ${JSON.stringify(p.p)}, p.n Hive block number ${p.n}, connectionId: ${connectionId}`,
                  _logStart
                )
                const podcastIndexIds: string[] = []
                for (const url of p.p.iris) {
                  try {
                    if (url?.startsWith('http')) {
                      let feedUrl: FeedUrl | null = null
                      try {
                        feedUrl = await getFeedUrlByUrl(url)
                      } catch (error) {
                        logPerformance(`p.p.iris error ${error}, connectionId: ${connectionId}`, _logStart)
                        console.log('attempting http or https fallback...')
                        if (!feedUrl) {
                          if (url.startsWith('https:')) {
                            const nextUrl = url.replace('https:', 'http:')
                            feedUrl = await getFeedUrlByUrl(nextUrl)
                          } else if (url.startsWith('http:')) {
                            const nextUrl = url.replace('http:', 'https:')
                            feedUrl = await getFeedUrlByUrl(nextUrl)
                          }
                        }
                      }
                      if (feedUrl?.podcast) {
                        const { podcastIndexId } = feedUrl.podcast
                        if (podcastIndexId) podcastIndexIds.push(podcastIndexId)
                      } else {
                        console.log('feed url not found')
                      }
                    }
                  } catch (err) {
                    logPerformance(`p.p.iris error ${err}, connectionId: ${connectionId}`, _logStart)
                  }
                }
                const queueType = 'live'
                await addFeedsToQueueForParsingByPodcastIndexId(podcastIndexIds, queueType)
              }
            }
          }
        } catch (err) {
          logPerformance(`message error: ${err}, connectionId: ${connectionId}`, _logEnd)
        }
      })

      client.on('close', (err) => {
        logPerformance(`WEBSOCKET_CLOSE: connection closed ${err}, connectionId: ${connectionId}`, _logEnd)
        openedSocket = false
        reject(err)
      })

      client.on('error', (err) => {
        logPerformance(`WEBSOCKET_ERROR: Error ${new Error(err.message)}, connectionId: ${connectionId}`, _logEnd)
        openedSocket = false
        reject(err)
      })
    })
  }

  async function reconnect() {
    try {
      await connect()
    } catch (err: any) {
      logPerformance(
        `WEBSOCKET_RECONNECT: Error ${new Error(err.message)}, connectionIdCount: ${connectionIdCount}`,
        _logStart
      )
    }
  }

  reconnect()

  // repeat every 5 seconds
  setInterval(() => {
    if (!openedSocket) {
      reconnect()
    }
  }, timeInterval)
}
