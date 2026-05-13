import { createApp } from 'vue'
import App from './App.vue'

import './assets/index.css'
import { initTheme } from './composables/useTheme'

initTheme()

createApp(App).mount('#app')
