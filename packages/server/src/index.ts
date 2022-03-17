import express from 'express'

export const app = express()
// @todo これだと SDP である意味がない気がするのでちゃんと実装する
app.use(express.text({ type: 'application/sdp' }))
app.use(express.json())

const channels = new Map<string, unknown>()

app.get('/channels', (req, res) => {
  console.log('GET /channels')
  console.log('channels', channels)
  res.json(Array.from(channels))
})

app.post('/channels', (req, res) => {
  const body: string = req.body
  console.log('>>>body')
  console.log(body)
  console.log('<<<body')
  const lines = body.split('\r\n')
  const origin = lines.find((v) => v.startsWith('o'))
  console.log('origin', origin)
  if (origin) {
    const [, sessId] = origin.split(' ')
    channels.set(sessId, body)
    console.log('stored', sessId)
  }
  res.send()
})

app.get('/channels/:id', ({ params: { id } }, res) => {
  res.send(channels.get(id))
})

app.put('/channels/:id', ({ params: { id }, body }, res) => {
  res.json(channels.set(id, body))
})
