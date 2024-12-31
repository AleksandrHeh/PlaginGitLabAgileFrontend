// src/router/router.js
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'AuthorizationForm',
    component: () => import('../components/AuthorizationForm.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/HomePage.vue')
  },
  // Добавьте другие маршруты
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
