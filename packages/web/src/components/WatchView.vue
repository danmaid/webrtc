<template>
  <div>watch</div>
  <div>
    {{ tracks }}
    <button @click="getTracks">GET Tracks</button>
  </div>
  <div>
    <button @click="watch">WATCH</button>
    <video v-if="go" :srcObject.prop="stream" autoplay controls></video>
  </div>
  <div>
    <button @click="check">check</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      tracks: [] as { id: string }[],
      peer: new RTCPeerConnection(),
      peers: [],
      stream: new MediaStream(),
      go: false,
    }
  },
  watch: {
    // channels(v: [string, RTCSessionDescription][]) {
    //   v.map(async ([channel, desc]) => {
    //     const peer = new RTCPeerConnection()
    //     await peer.setRemoteDescription(desc)
    //     const answer = await peer.createAnswer()
    //     console.log(answer)
    //     await peer.setLocalDescription(answer)
    //     fetch(`/channels/${channel}`, {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify(answer),
    //     })
    //   })
    // },
  },
  mounted() {
    this.peer.addEventListener('track', (ev) => {
      console.log('track')
      this.stream.addTrack(ev.track)
      console.log(this.stream)
      console.log(this.stream.getTracks())
      this.go = true
    })
  },
  methods: {
    async getTracks() {
      this.tracks = await fetch('/tracks').then((r) => r.json())
    },
    async watch() {
      const body = JSON.stringify({ tracks: this.tracks.map((v) => v.id) })
      const id = await fetch('/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).then((v) => v.json())
      const ws = new WebSocket(`ws://${location.host}/clients/${id}`)
      ws.addEventListener('message', async (ev) => {
        const { description } = JSON.parse(ev.data)
        if (description) {
          await this.peer.setRemoteDescription(description)
          if (description.type === 'offer') {
            await this.peer.setLocalDescription()
            ws.send(JSON.stringify({ description: this.peer.localDescription }))
          }
        }
      })
      this.peer.addEventListener('negotiationneeded', async () => {
        await this.peer.setLocalDescription()
        ws.send(JSON.stringify({ description: this.peer.localDescription }))
      })
    },
    check() {
      console.log(this.peer)
    },
  },
})
</script>
