export interface Connection {
  id: string
  cast(stream: MediaStream): void
  watch(): MediaStream
}

export class Connection {
  stream?: MediaStream
  peer: RTCPeerConnection
  #ws: WebSocket
  #senders: RTCRtpSender[] = []

  constructor(public path: string) {
    const peer = new RTCPeerConnection()
    const ws = new WebSocket(`ws://${location.host}${path}`)
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
    peer.ontrack = ({ track }) => {
      console.debug('peer.ontrack', track)
      if (!this.stream) this.stream = new MediaStream()
      this.stream.addTrack(track)
    }

    this.peer = peer
    this.#ws = ws
  }

  cast(stream: MediaStream): void {
    this.#senders.forEach((v) => this.peer.removeTrack(v))
    const senders = stream.getTracks().map((v) => this.peer.addTrack(v))
    this.#senders.push(...senders)
    this.stream = stream
  }

  watch(): MediaStream {
    if (!this.stream) this.stream = new MediaStream()
    this.peer.restartIce()
    return this.stream
  }
}
