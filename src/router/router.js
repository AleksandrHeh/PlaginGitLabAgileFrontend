import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'AuthorizationForm',
    component: () => import('@/components/AuthorizationForm.vue'),
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/components/HomePage.vue'),
    meta: { requiresAuth: true }, 
  },
  {
    path: '/oauth/callback',
    name: 'OAuthCallback',
    component: () => import('@/components/OAuthCallback.vue'), 
  },
  {
    path: '/projects',
    name: 'ProjectsPage',
    component: () => import('@/views/ProjectsPage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Глобальный страж маршрутов
router.beforeEach((to, from, next) => {
  const user = localStorage.getItem('user');

  if (to.meta.requiresAuth && !user) {
    next({ name: 'AuthorizationForm' }); // Перенаправляем на страницу входа
  } else if (user && to.name === 'AuthorizationForm') {
    next({ name: 'Home' }); // Если пользователь уже авторизован, перенаправляем на домашнюю страницу
  } else {
    next(); // Разрешаем переход
  }
});

export default router;