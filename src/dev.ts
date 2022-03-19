import { app, server } from '@dm-webrtc/server/src'
import { createServer as createViteServer } from 'vite'
import path from 'path'

async function create() {
  const vite = await createViteServer({
    root: path.resolve(__dirname, '../packages/web'),
    server: { middlewareMode: 'html' },
  })
  app.use(vite.middlewares)
}

create().then(() => {
  server.listen(3000, () => {
    console.log('http://localhost:3000')
  })
})
