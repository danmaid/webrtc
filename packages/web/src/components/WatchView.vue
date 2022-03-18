<template>
  <div>watch</div>
  <div>
    <div v-for="channel of channels">
      <pre>{{ channel[1] }}</pre>
    </div>
    <button @click="getChannels">GET Channels</button>
  </div>
  <div>
    <button @click="watch">WATCH</button>
    <video :srcObject.prop="stream" autoplay></video>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      channels: [],
      peers: [],
      stream: new MediaStream(),
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
  methods: {
    async getChannels() {
      this.channels = await fetch('/channels').then((r) => r.json())
    },
    async watch() {
      const peer = new RTCPeerConnection()
      peer.addEventListener('track', (ev) => {
        console.log('track!!')
        this.stream.addTrack(ev.track)
      })
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      const answer = await fetch('/channels/1/listeners/2', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      }).then((r) => r.text())
      console.log('ANSWER!!', answer)
      await peer.setRemoteDescription({ type: 'answer', sdp: answer })
      console.log(peer.remoteDescription)
    },
  },
})
</script>
