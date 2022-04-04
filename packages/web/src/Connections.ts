import { Connection } from './Connection'

export interface Connections {
  create(): Promise<Connection>
}

export class Connections extends Map<string, Connection> {
  async create(): Promise<Connection> {
    const { id, path } = await fetch('/casts', { method: 'POST' }).then((v) =>
      v.json()
    )
    const conn: Connection = new Connection(path)
    this.set(id, conn)
    return conn
  }

  async #load(): Promise<void> {
    const clients: [string][] = await fetch('/casts').then((v) => v.json())
    clients.forEach(([id]) => this.set(id, new Connection(id)))
  }
}
