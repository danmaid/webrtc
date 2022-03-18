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

  async addCaster(signaler: string) {
    const page = await this.page
    await page.evaluate(async () => {
      const peer = new RTCPeerConnection()
      peer.addEventListener('track', (ev) => tracks.push(ev.track))
      const ws = new WebSocket(signaler)
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
    }, signaler)
  }

  async getAnswer(offer: string) {
    const page = await this.page
    return page.evaluate(async (offer: string) => {
      const peer = new RTCPeerConnection()
      peer.addEventListener('track', (ev) => {
        console.log('ontrack!!')
        tracks.push(ev.track)
      })
      await peer.setRemoteDescription({ type: 'offer', sdp: offer })
      const { sdp } = await peer.createAnswer()
      return sdp
    }, offer)
  }
  async addListener(offer: string) {
    const page = await this.page
    return page.evaluate(async (offer: string) => {
      const peer = new RTCPeerConnection()
      tracks.forEach((v) => peer.addTrack(v))
      console.log(peer.localDescription?.sdp)
      await peer.setRemoteDescription({ type: 'offer', sdp: offer })
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      return answer.sdp
    }, offer)
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
