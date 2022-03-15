import { Plugin } from 'vue'

export const cast: Plugin = {
  install: (app, options) => {
    app.config.globalProperties.$cast = {
      add(device: MediaDeviceInfo): void {},
      has(device: MediaDeviceInfo): boolean {
        return true
      },
      delete(device: MediaDeviceInfo): void {},
    }
  },
}

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $cast: {
      add(device: MediaDeviceInfo): void
      has(device: MediaDeviceInfo): boolean
      delete(device: MediaDeviceInfo): void
    }
  }
}
