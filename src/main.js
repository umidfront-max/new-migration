import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/app.css'
import './styles/views.css'

createApp(App).use(router).mount('#app')
