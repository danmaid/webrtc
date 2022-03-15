<template v-for="channel of group.channels">
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

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    device: { type: Object as PropType<MediaDeviceInfo>, required: true },
  },
  computed: {
    cast: {
      get(): boolean {
        return this.$cast.has(this.device)
      },
      set(v: boolean) {
        v ? this.$cast.add(this.device) : this.$cast.delete(this.device)
      },
    },
  },
})
</script>
