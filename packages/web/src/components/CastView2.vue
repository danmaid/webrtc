<template>
  <div>
    <button @click="cast">配信</button>
    <video :srcObject.prop="stream" autoplay></video>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Connection } from '../Connection'

export default defineComponent({
  data() {
    return {
      stream: undefined as MediaStream | undefined,
      id: undefined,
    }
  },
  methods: {
    async cast() {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        // audio: true,
      })
      const res = await fetch('/casts', { method: 'POST' })
      const { path } = await res.json()
      const conn = new Connection(path)
      conn.cast(this.stream)
    },
  },
})
</script>
