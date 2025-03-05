// src/router/router.js
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'AuthorizationForm',
    component: () => import('../components/AuthorizationForm.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../components/HomePage.vue')
  },
  {
    path: '/project/:id',
    name: 'ProjectPage',
    component: () => import('../components/ProjectPage.vue'),
    props: true
  }
  
  // Добавьте другие маршруты
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;