import puppeteer, { Page } from 'puppeteer'

declare global {
  var tracks: MediaStreamTrack[]
}

export class SFU {
  browser = puppeteer.launch()
  page: Promise<Page>

  constructor() {
    this.page = this.browser
      .then((v) => v.newPage())
      .then((page) => {
        page.on('console', (msg) => {
          console.log('--- browser console ---')
          console.log(msg.text())
          console.log('------')
        })
        page.evaluate(() => {
          tracks = []
        })
        return page
      })
  }

  async addClient(signalUrl: string, trackIds: string[]) {
    const page = await this.page
    await page.evaluate(
      async (signalUrl, trackIds) => {
        const peer = new RTCPeerConnection()
        peer.addEventListener('track', (ev) => {
          console.log('track')
          tracks.push(ev.track)
        })
        const ws = new WebSocket(signalUrl)
        ws.addEventListener('message', async (ev) => {
          const { description, candidate } = JSON.parse(ev.data)
          if (description) {
            await peer.setRemoteDescription(description)
            if (description.type === 'offer') {
              await peer.setLocalDescription()
              ws.send(JSON.stringify({ description: peer.localDescription }))
            }
          }
          if (candidate) {
            await peer.addIceCandidate(candidate)
          }
        })
        peer.addEventListener('negotiationneeded', async () => {
          await peer.setLocalDescription()
          ws.send(JSON.stringify({ description: peer.localDescription }))
        })
        peer.addEventListener('icecandidate', ({ candidate }) => {
          ws.send(JSON.stringify({ candidate }))
        })
        tracks
          .filter((v) => trackIds?.includes(v.id))
          .forEach((v) => peer.addTrack(v))
      },
      signalUrl,
      trackIds
    )
  }

  async getTracks() {
    const page = await this.page
    return page.evaluate(() => {
      return tracks.map((v) => ({
        enabled: v.enabled,
        id: v.id,
        kind: v.kind,
        label: v.label,
        muted: v.muted,
        readyState: v.readyState,
      }))
    })
  }
}
