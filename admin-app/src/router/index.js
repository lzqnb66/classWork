import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Users from '../views/Users.vue';
import UserPermissions from '../views/UserPermissions.vue';
import DietRecords from '../views/DietRecords.vue';
import StepsRecords from '../views/StepsRecords.vue';
import SleepRecords from '../views/SleepRecords.vue';
import { useAuthStore } from '../store/store.js';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: Login },
    // { path: '/dashboard', component: Dashboard },
    { path: '/users', component: Users },
    { path: '/user-permissions', component: UserPermissions },
    { path: '/diet-records', component: DietRecords },
    { path: '/steps-records', component: StepsRecords },
    { path: '/sleep-records', component: SleepRecords },
  ]
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  
  // 检查是否需要认证
  if (to.path !== '/login') {
    if (!auth.isAuthed) {
      return next('/login');
    }
    
    // 检查管理员权限
    if (!auth.user?.is_admin) {
      return next('/login');
    }
  }
  
  next();
});

export default router;
