import { Broadcast } from './Broadcast'

export const casts = new Map<string, Broadcast>()

export async function createCast(options: { basePath?: string }): Promise<Broadcast> {
  const cast = new Broadcast(options)
  await cast.initialize()
  casts.set(cast.id, cast)
  return cast
}
