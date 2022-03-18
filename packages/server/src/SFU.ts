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

  async addClient(signalUrl: string, tracks:  string[]) {
    const page = await this.page
    await page.evaluate(async (signalUrl, trackIds) => {
      const peer = new RTCPeerConnection()
      peer.addEventListener('track', (ev) => tracks.push(ev.track))
      tracks.filter(id => trackIds.includes(id)).forEach(v => peer.addTrack(v))
      const ws = new WebSocket(signalUrl)
      ws.addEventListener('message', async (ev) => {
        const { description } = JSON.parse(ev.data)
        if (description) {
          await peer.setRemoteDescription(description)
          if (description.type === 'offer') {
            await peer.setLocalDescription()
            ws.send(JSON.stringify({ description: peer.localDescription }))
          }
        }
      })
    }, signalUrl, tracks)
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
