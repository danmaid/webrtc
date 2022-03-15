import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { cast } from './cast'

const app = createApp(App)
app.use(router)
app.use(cast)
app.mount('#app')
