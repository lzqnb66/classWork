import { createRouter, createWebHistory } from 'vue-router';
import Login from './views/Login.vue';
import Dashboard from './views/Dashboard.vue';
import { useAuthStore } from './store.js';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/dashboard', component: Dashboard },
  ]
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.path.startsWith('/dashboard')) {
    if (!auth.isAuthed || !auth.user?.is_admin) return next('/login');
  }
  next();
});

export default router;