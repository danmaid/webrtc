<template>
  <div>
    <button @click="cast">配信</button>
    <video :srcObject.prop="stream" autoplay></video>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      stream: undefined as MediaStream | undefined,
      id: undefined,
    }
  },
  methods: {
    async cast() {
      const peer = new RTCPeerConnection()
      const res = await fetch('/clients', { method: 'POST' })
      const id = await res.json()
      const ws = new WebSocket(`ws://${location.host}/clients/${id}`)
      ws.addEventListener('message', async (ev) => {
        const { description, candidate } = JSON.parse(ev.data)
        if (description) {
          await peer.setRemoteDescription(description)
          if (description.type === 'offer') {
            await peer.setLocalDescription()
            ws.send(JSON.stringify({ description: peer.localDescription }))
          }
        }
        if (candidate) {
          await peer.addIceCandidate(candidate)
        }
      })
      peer.addEventListener('negotiationneeded', async () => {
        await peer.setLocalDescription()
        ws.send(JSON.stringify({ description: peer.localDescription }))
      })
      peer.addEventListener('icecandidate', ({ candidate }) => {
        ws.send(JSON.stringify({ candidate }))
      })
      this.id = id
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        // audio: true,
      })
      this.stream.getTracks().forEach((v) => peer.addTrack(v))
    },
  },
})
</script>
