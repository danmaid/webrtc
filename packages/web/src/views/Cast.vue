<template>
  <div>
    <grouping-switch></grouping-switch>
    チャンネル一覧
    <template v-for="channel of [{ label: '1', kind: 'audioinput', cast: false, preview: true }]">
      <label>{{ channel.label }}</label>
      <cast-switch v-model="channel.cast"></cast-switch>
      <preview-switch v-model="channel.preview"></preview-switch>
      <microphone-icon v-if="channel.kind === 'audioinput'"></microphone-icon>
      <speaker-icon v-if="channel.kind === 'audiooutput'"></speaker-icon>
      <camera-icon v-if="channel.kind === 'videoinput'"></camera-icon>
      <template v-if="channel.preview">
        <audio v-if="channel.kind.startsWith('audio')"></audio>
        <video v-if="channel.kind.startsWith('video')"></video>
      </template>
    </template>
    <button>add screen</button>
  </div>
  <hr />
  <div v-for="device of enumerated">{{ device }}</div>
  <hr />
  <div v-for="device of devices">{{ device }}</div>
  <hr />
  <div v-for="device of grouped">
    {{ device }}
    <template v-if="streams.some((v) => v.groupId === device.id)">
      <video :srcObject.prop="getStream(device.id)" autoplay></video>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

type Group = {
  id: string
  label: string
  audio: MediaDeviceInfo[]
  video: MediaDeviceInfo[]
}

export default defineComponent({
  data() {
    return {
      enumerated: [] as MediaDeviceInfo[],
      streams: [] as { groupId: string; stream: MediaStream }[],
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
    // 対がわかるようにグループ化
    grouped(): Group[] {
      return this.devices.reduce((a, c) => {
        const exist = a.find((v) => v.id === c.groupId)
        const group = exist || { id: c.groupId, label: c.label, audio: [], video: [] } // prettier-ignore
        if (!exist) a.push(group)
        if (c.kind === 'audioinput') group.audio.push(c)
        if (c.kind === 'videoinput') {
          group.video.push(c)
          group.label = c.label
        }
        return a
      }, [] as typeof this.grouped)
    },
  },
  watch: {
    // グループごとにプレビュー用ストリームを取得
    async grouped(v: Group[]) {
      const streams = v.map(async ({ id: groupId, audio, video }) => {
        return {
          groupId,
          stream: await navigator.mediaDevices.getUserMedia({
            // audio: { groupId, deviceId: { exact: audio[0]?.deviceId } },
            video: { groupId, deviceId: { exact: video[0]?.deviceId } },
          }),
        }
      })
      this.streams = await Promise.all(streams)
    },
  },
  async mounted() {
    this.enumerated = await navigator.mediaDevices.enumerateDevices()
  },
  methods: {
    getStream(id: string): MediaStream | undefined {
      return this.streams.find((v) => v.groupId === id)?.stream
    },
  },
})
</script>
