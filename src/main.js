import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router';
import Toast from 'vue-toastification';
import { createPinia } from 'pinia';
import 'vue-toastification/dist/index.css'; // импорт стилей
import store from './store'

const pinia = createPinia();
const app = createApp(App);
app.use(store)
app.use(router);
app.use(pinia)
app.use(Toast);  // подключаем Toast

app.mount('#app');
