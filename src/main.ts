import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './styles/main.css'
import App from './App.vue'

// Import Leaflet styles
import 'leaflet/dist/leaflet.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
