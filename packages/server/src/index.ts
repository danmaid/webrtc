import express from 'express'
import { SFU } from './SFU'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { v4 as uuid } from 'uuid'

export const app = express()
export const server = createServer(app)

function getPort(): number | undefined {
  const addr = server.address()
  if (!addr || typeof addr === 'string') return undefined
  return addr.port
}

app.use(express.text({ type: 'application/sdp' }))
app.use(express.json())

const sfu = new SFU()

const signals = new Map<string, WebSocketServer>()

app.get('/signals', (req, res) => {
  res.json(Array.from(signals))
})

function addSignal(path: string): WebSocketServer {
  const wss = new WebSocketServer({ server, path })
  wss.on('connection', (socket, req) => {
    socket.on('message', (data) => {
      wss.clients.forEach((v) => {
        if (v === socket) return
        v.send(data)
      })
    })
  })
  signals.set(path, wss)
  return wss
}

const clients = new Map<string, unknown>()

app.get('/clients', (req, res) => {
  res.json(Array.from(casters))
})

app.post('/clients', async (req, res) => {
  const id = uuid()
  addSignal(`/clients/${id}`)
  await sfu.addClient(`ws://localhost:${getPort()}/clients/${id}`, req.body?.tracks)
  clients.set(id, req.body)
  res.json(id)
})

// const channels = new Map<
//   string,
//   { offer: string; sfu: SFU; listeners: Map<string, string> }
// >()

// app.get('/channels', (req, res) => {
//   console.log('GET /channels')
//   console.log('channels', channels)
//   res.json(Array.from(channels))
// })

// app.put('/channels/:id', async (req, res) => {
//   const offer: string = req.body
//   const sfu = new SFU(offer)
//   const answer = await sfu.getAnswer()
//   channels.set(req.params.id, { offer, sfu, listeners: new Map() })
//   res.send(answer)
// })

// app.get('/channels/:id', async (req, res) => {
//   const channel = channels.get(req.params.id)
//   if (!channel) return res.sendStatus(404)
//   const track = await channel.sfu.getTracks()
//   console.log(track)
//   res.json(track)
// })

// app.put('/channels/:channel/listeners/:id', async (req, res) => {
//   const channel = channels.get(req.params.channel)
//   if (!channel) return res.sendStatus(404)
//   const offer: string = req.body
//   console.log('OFFER!!', offer)
//   const answer = await channel.sfu.addListener(offer)
//   channel.listeners.set(req.params.id, offer)
//   res.send(answer)
// })
