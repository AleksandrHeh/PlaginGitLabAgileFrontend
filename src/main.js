import { createApp } from 'vue';
import App from './App.vue';
import router from './router/router';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css'; // импорт стилей

const app = createApp(App);
app.use(router);
app.use(Toast);  // подключаем Toast

app.mount('#app');
