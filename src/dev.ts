import express from 'express'
import { app } from '@dm-webrtc/server'
import { createServer as createViteServer } from 'vite'
import path from 'path'

const server = express()
server.use(app)

async function create() {
  const vite = await createViteServer({
    root: path.resolve(__dirname, '../packages/web'),
    server: { middlewareMode: 'html' },
  })
  server.use(vite.middlewares)
}

create().then(() => {
  server.listen(3000, () => {
    console.log('http://localhost:3000')
  })
})
