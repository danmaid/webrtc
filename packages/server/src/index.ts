import express from 'express'
import { createServer } from 'http'
import { signals } from './signals'
import { casts, createCast } from './casts'

export const app = express()
export const server = createServer(app)

app.use(express.json())

app.get('/signals', (_, res) => res.json(Array.from(signals)))
app.get('/casts', (_, res) => res.json(Array.from(casts)))
app.post('/casts', async (_, res) => {
  res.json(await createCast({ basePath: '/casts' }))
})
app.post('/casts/:id/watchers', async ({ params: { id } }, res) => {
  const cast = casts.get(id)
  cast ? res.json(await cast.createWatcher()) : res.sendStatus(404)
})

server.on('upgrade', (req, socket, head) => {
  const url = req.url
  if (!url) return socket.destroy()
  const wss = signals.get(url)
  if (!wss) return socket.destroy()
  wss.handleUpgrade(req, socket, head, (ws, req) => {
    wss.emit('connection', ws, req)
  })
})
