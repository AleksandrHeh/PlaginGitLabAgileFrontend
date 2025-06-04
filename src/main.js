import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router';
import Toast from 'vue-toastification';
import { createPinia } from 'pinia';
import 'vue-toastification/dist/index.css'; // импорт стилей
import store from './store'
import axios from 'axios'

// Настройка Axios
axios.defaults.baseURL = 'http://localhost:4000'
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const pinia = createPinia();
const app = createApp(App);
app.use(store)
app.use(router);
app.use(pinia)
app.use(Toast);  // подключаем Toast

app.mount('#app');
