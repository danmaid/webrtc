<template>
  <div>watch</div>
  <button @click="fetch">fetch</button>
  <div style="display: flex; flex-wrap: wrap">
    <div v-for="{ id, connection } of items">
      <div>{{ id }}</div>
      <button @click="watch(id)">watch</button>
      <template v-if="connection">
        <video :srcObject.prop="connection.watch()" autoplay controls></video>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Connection } from '../Connection'

export default defineComponent({
  data() {
    return {
      casts: [] as [string][],
      connections: new Map<string, Connection>(),
    }
  },
  computed: {
    items(): { id: string; connection?: Connection }[] {
      return this.casts.map(([id]) => ({
        id,
        connection: this.connections.get(id),
      }))
    },
  },
  methods: {
    async fetch() {
      this.casts = await fetch('/casts').then((v) => v.json())
    },
    async watch(id: string) {
      const res = await fetch(`/casts/${id}/watchers`, { method: 'POST' })
      const { path } = await res.json()
      this.connections.set(id, new Connection(path))
    },
  },
})
</script>
