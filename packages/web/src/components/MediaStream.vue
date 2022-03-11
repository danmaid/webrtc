<template>
  <div></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  props: {
    value: { type: Object as PropType<MediaStream> },
  },
})
</script>
