<template>
  <div>
    <div>配信</div>
    {{ id }}
    <button @click="connect">connect</button>
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
      peer: new RTCPeerConnection(),
      senders: [] as RTCRtpSender[],
      res: undefined as any,
      id: undefined,
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
    this.senders = this.peer.getSenders()
    this.peer.addEventListener('track', () => {
      console.log('on track')
      this.senders = this.peer.getSenders()
    })
  },
  methods: {
    async connect() {
      const id = await fetch('/clients', { method: 'POST' }).then((v) =>
        v.json()
      )
      const ws = new WebSocket(`ws://${location.host}/clients/${id}`)
      ws.addEventListener('message', async (ev) => {
        const { description, candidate } = JSON.parse(ev.data)
        if (description) {
          await this.peer.setRemoteDescription(description)
          if (description.type === 'offer') {
            await this.peer.setLocalDescription()
            ws.send(JSON.stringify({ description: this.peer.localDescription }))
          }
        }
        if (candidate) {
          await this.peer.addIceCandidate(candidate)
        }
      })
      this.peer.addEventListener('negotiationneeded', async () => {
        await this.peer.setLocalDescription()
        ws.send(JSON.stringify({ description: this.peer.localDescription }))
      })
      this.peer.addEventListener('icecandidate', ({ candidate }) => {
        ws.send(JSON.stringify({ candidate }))
      })
      this.id = id
    },
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
    addTrack(v: MediaDeviceInfo) {
      const stream = this.getStream(v)
      if (!stream) return []
      stream.getTracks().map((v) => this.peer.addTrack(v))
      this.senders = this.peer.getSenders()
      console.log(stream.getTracks())
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
        this.peer.removeTrack(this.senders[index])
      })
      this.sendOffer()
    },
  },
})
</script>
