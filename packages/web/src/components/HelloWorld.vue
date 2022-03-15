<template>
  <div>
    <button @click="connect">connect</button>
    <hr />
    <select v-model="video">
      <option v-for="input of videoinputs" :value="input">
        {{ input.label }}
      </option>
    </select>
    <button @click="setDefault">default</button>
    <button @click="setDisplayMedia">DisplayMedia</button>
    <button @click="setAll">setAll</button>
    <hr />
    <video autoplay :srcObject.prop="stream" style="width: 300px"></video>
    <hr />
    <video
      v-for="video of all"
      :srcObject.prop="video"
      style="width: 300px"
    ></video>
    <hr />
    <button v-for="video of videoinputs" @click="addVideo(video)">
      {{ video.label }}
    </button>
    <hr />
    <video
      v-for="video of videos"
      :srcObject.prop="video"
      autoplay
      style="width: 300px; border: 1px solid black"
    ></video>
    <hr />
    <MediaStream></MediaStream>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MediaStream from './MediaStream.vue'

export default defineComponent({
  components: { MediaStream },
  data() {
    return {
      devices: [] as MediaDeviceInfo[],
      video: undefined as MediaDeviceInfo | undefined,
      stream: undefined as MediaStream | undefined,
      all: [] as MediaStream[],
      videos: [] as MediaStream[],
      peer: undefined as RTCPeerConnection | undefined,
    }
  },
  computed: {
    audioinputs(): MediaDeviceInfo[] {
      return this.devices.filter((v) => v.kind === 'audioinput')
    },
    audiooutputs(): MediaDeviceInfo[] {
      return this.devices.filter((v) => v.kind === 'audiooutput')
    },
    videoinputs(): MediaDeviceInfo[] {
      return this.devices.filter((v) => v.kind === 'videoinput')
    },
  },
  watch: {
    video(v?: MediaDeviceInfo) {
      if (v) this.setStream(v.deviceId)
    },
  },
  mounted() {
    this.setDevices()
  },
  methods: {
    async setDevices() {
      this.devices = await navigator.mediaDevices.enumerateDevices()
      console.log(this.devices)
    },
    async setDefault() {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
    },
    async setStream(deviceId: string) {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { exact: deviceId } },
      })
    },
    async setDisplayMedia() {
      this.stream = await (navigator.mediaDevices as any).getDisplayMedia()
    },
    async setAll() {
      console.log('>>setAll')
      this.videoinputs.map(async (v) => {
        console.log(v.label)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { deviceId: { exact: v.deviceId } },
        })
        this.videos.push(stream)
      })
      console.log('<<setAll')
    },
    async addVideo(media: MediaDeviceInfo) {
      this.videos.push(
        await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { deviceId: { exact: media.deviceId } },
        })
      )
    },
    connect() {
      this.peer = new RTCPeerConnection()
      this.peer.createOffer().then((v) => {
        console.log(v)
      })
      this.peer.addEventListener('negotiationneeded', async function () {
        console.log('negotiationneeded')
        const offer = await this.createOffer()
        await this.setLocalDescription(offer)
        console.log('localDescription', this.localDescription)
      })
    },
  },
})
</script>
