import puppeteer, { Page } from 'puppeteer'
import { v4 as uuid } from 'uuid'
import { createSignal } from './signals'

declare global {
  var stream: MediaStream
}

export class Broadcast {
  id = uuid()
  basePath = ''
  path: string
  browser = puppeteer.launch()
  page: Promise<Page> = this.browser.then((v) => v.newPage())
  watchers: Map<string, { id: string; path: string }> = new Map()

  constructor(options: { basePath?: string } = {}) {
    if (options.basePath) this.basePath = options.basePath
    this.path = `${this.basePath}/${this.id}`
  }

  async initialize(): Promise<this> {
    // create Signaling Socket
    createSignal(this.path)
    // add caster to SFU
    const page = await this.page
    page.on('console', (msg) => {
      console.log('\x1b[32mBroadcast:\x1b[39m', msg.text())
    })
    await page.evaluate(() => (stream = new MediaStream()))
    await this.createCaster()
    return this
  }

  async createCaster(): Promise<void> {
    const page = await this.page
    await page.evaluate(async (signalUrl) => {
      const peer = new RTCPeerConnection()
      const ws = new WebSocket(signalUrl)
      ws.onmessage = async ({ data }) => {
        console.debug('ws.onmessage', data)
        const { description, candidate } = JSON.parse(data)
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
      }
      peer.onnegotiationneeded = async () => {
        console.debug('peer.onnegotiationneeded')
        await peer.setLocalDescription()
        ws.send(JSON.stringify({ description: peer.localDescription }))
      }
      peer.onicecandidate = ({ candidate }) => {
        console.debug('peer.onicecandidate', candidate)
        ws.send(JSON.stringify({ candidate }))
      }
      peer.ontrack = ({ track }) => {
        console.debug('peer.ontrack', track)
        stream.addTrack(track)
      }
      await new Promise<void>((resolve) => (ws.onopen = () => resolve()))
    }, `ws://localhost:3000${this.path}`)
  }

  async createWatcher(): Promise<{ id: string; path: string }> {
    // create Signaling Socket
    const id = uuid()
    const path = `${this.path}/watchers/${id}`
    createSignal(path)
    this.watchers.set(id, { id, path })
    // add watcher to SFU
    const page = await this.page
    await page.evaluate((signalUrl) => {
      const peer = new RTCPeerConnection()
      const ws = new WebSocket(signalUrl)
      ws.onmessage = async ({ data }) => {
        console.debug('ws.onmessage', data)
        const { description, candidate } = JSON.parse(data)
        if (description) {
          await peer.setRemoteDescription(description)
          if (description.type === 'offer') {
            await peer.setLocalDescription()
            ws.send(JSON.stringify({ description: peer.localDescription }))
          }
        }
        if (candidate) await peer.addIceCandidate(candidate)
      }
      peer.onnegotiationneeded = async () => {
        console.debug('peer.onnegotiationneeded')
        await peer.setLocalDescription()
        ws.send(JSON.stringify({ description: peer.localDescription }))
      }
      peer.onicecandidate = ({ candidate }) => {
        console.debug('peer.onicecandidate', candidate)
        ws.send(JSON.stringify({ candidate }))
      }
      stream.getTracks().map((v) => peer.addTrack(v))
      stream.onaddtrack = ({ track }) => peer.addTrack(track)
      stream.onremovetrack = ({ track }) => {
        const sender = peer.getSenders().find((v) => v.track === track)
        sender ? peer.removeTrack(sender) : console.warn('sender not found.')
      }
      console.debug('set watcher', peer.localDescription)
    }, `ws://localhost:3000${path}`)
    return { id, path }
  }

  toJSON() {
    const { id, path, watchers } = this
    return { id, path, watchers: Array.from(watchers) }
  }
}
