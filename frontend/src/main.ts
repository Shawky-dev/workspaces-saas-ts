import { createApp } from 'vue'
import App from './App.vue'
import { router } from './app/router'

import './assets/index.css'
import { initTheme } from './composables/useTheme'

initTheme()

createApp(App).use(router).mount('#app')
