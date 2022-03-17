<template>
  <div>
    <div>配信</div>
    <div>
      <button @click="sendOffer">offer</button>
      {{ res }}
    </div>

    <div v-for="sender of senders">
      <div>track: {{ sender.track }}</div>
      <div>transport: {{ sender.transport }}</div>
      <div>Parameters: {{ sender.getParameters() }}</div>
    </div>
    <hr />
    チャンネル一覧
    <hr />
    <div v-for="group of groups">
      <div v-for="device of group.devices">
        <div>
          <label>{{ device.label }}</label>
          <span v-if="device.kind === 'audioinput'">microphone-icon</span>
          <span v-if="device.kind === 'audiooutput'">speaker-icon</span>
          <span v-if="device.kind === 'videoinput'">camera-icon</span>
          <button @click="addTrack(device)">add</button>
          <button @click="removeCast(device)">remove</button>
        </div>
        <audio
          v-if="device.kind?.startsWith('audio')"
          :srcObject.prop="getStream(device)"
          controls
        ></audio>
        <video
          v-if="device.kind?.startsWith('video')"
          :srcObject.prop="getStream(device)"
          autoplay
        ></video>
      </div>
      <hr />
    </div>
    <hr />
    <button>add screen</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

interface Group {
  groupId: MediaDeviceInfo['groupId']
  devices: MediaDeviceInfo[]
}

export default defineComponent({
  data() {
    return {
      enumerated: [] as MediaDeviceInfo[],
      streams: [] as { deviceId: string; stream: MediaStream | undefined }[],
      connection: new RTCPeerConnection(),
      senders: [] as RTCRtpSender[],
      res: undefined as any,
    }
  },
  computed: {
    // 列挙されたデバイスから不要なものを排除したデバイスリスト
    devices(): MediaDeviceInfo[] {
      return this.enumerated.filter(
        (v) =>
          v.deviceId !== 'default' &&
          v.deviceId !== 'communications' &&
          (v.kind === 'audioinput' || v.kind === 'videoinput')
      )
    },
    groups(): Group[] {
      return this.devices
        .sort((a, b) => (b.kind === 'videoinput' ? 1 : -1))
        .reduce((a, c) => {
          const exist = a.find((v) => v.groupId === c.groupId)
          if (exist) exist.devices.push(c)
          else a.push({ groupId: c.groupId, devices: [c] })
          return a
        }, [] as Group[])
    },
  },
  watch: {
    async devices() {
      this.setStreams()
    },
  },
  async mounted() {
    this.enumerated = await navigator.mediaDevices.enumerateDevices()
    this.senders = this.connection.getSenders()
    this.connection.addEventListener('track', () => {
      console.log('on track')
      this.senders = this.connection.getSenders()
    })
  },
  methods: {
    getStream(device: MediaDeviceInfo): MediaStream | undefined {
      const stream = this.streams.find((v) => v.deviceId === device.deviceId)
      return stream?.stream
    },
    async setStreams() {
      async function getTrackStream(v: MediaDeviceInfo): Promise<MediaStream> {
        const track = { deviceId: { exact: v.deviceId } }
        const audio = v.kind.startsWith('audio') && track
        const video = v.kind.startsWith('video') && track
        return navigator.mediaDevices.getUserMedia({ audio, video })
      }
      const streams = this.devices.map(async (v) => ({
        deviceId: v.deviceId,
        stream: await getTrackStream(v).catch((err) => {
          console.warn('ignored', err)
          return undefined
        }),
      }))
      this.streams = await Promise.all(streams)
    },
    async sendOffer() {
      const offer = await this.connection.createOffer()
      console.log('offer', offer)
      const { sdp } = offer
      if (!sdp) return
      const headers = new Headers({ 'Content-Type': 'application/sdp' })
      const body = offer.sdp
      const res = await fetch('/channels', { method: 'POST', body, headers })
      const { ok, status, statusText } = res
      this.res = { ok, status, statusText }
    },
    addTrack(v: MediaDeviceInfo) {
      const stream = this.getStream(v)
      if (!stream) return []
      stream.getTracks().map((v) => this.connection.addTrack(v))
      this.senders = this.connection.getSenders()
      this.sendOffer()
    },
    removeCast(device: MediaDeviceInfo) {
      const stream = this.streams.find((v) => v.deviceId === device.deviceId)
      if (!stream?.stream) {
        console.warn('stream not found.', device)
        return
      }
      stream.stream.getTracks().forEach((track) => {
        const index = this.senders.findIndex((v) => v.track === track)
        if (index < 0) {
          console.warn('track not found.', track)
          return
        }
        this.connection.removeTrack(this.senders[index])
      })
      this.sendOffer()
    },
  },
})
</script>
