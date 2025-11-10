import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('supportToken');
  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login' });
  }
  if (to.name === 'login' && token) {
    return next({ name: 'dashboard' });
  }
  return next();
});

export default router;
