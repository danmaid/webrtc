import express from 'express'

export const app = express()
app.use(express.json())

const channels = new Map<string, unknown>()

app.get('/channels', (req, res) => {
  res.json(Object.entries(channels))
})

app.get('/channels/:id', ({ params: { id } }, res) => {
  res.json(channels.get(id))
})

app.put('/channels/:id', ({ params: { id }, body }, res) => {
  res.json(channels.set(id, body))
})
