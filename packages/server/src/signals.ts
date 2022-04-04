import { WebSocketServer } from 'ws'

export const signals = new Map<string, WebSocketServer>()

export function createSignal(path: string): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true })
  wss.on('connection', (ws, req) => {
    ws.on('message', (data, binary) => {
      wss.clients.forEach((v) => {
        if (v === ws) return
        v.send(data, { binary })
      })
      console.log('\x1b[33mSignal:\x1b[39m',data.toString())
    })
  })
  signals.set(path, wss)
  return wss
}
