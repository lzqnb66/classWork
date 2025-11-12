import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Home from '../views/Home.vue';
import DietRecord from '../modules/diet/DietRecord.vue';
import StepsRecord from '../modules/steps/StepsRecord.vue';
import SleepRecord from '../modules/sleep/SleepRecord.vue';
import RangeQuery from '../modules/query/RangeQuery.vue';
import Profile from '../views/Profile.vue';
import ChangePassword from '../views/ChangePassword.vue';
import MyPage from '../views/MyPage.vue';
import Index from '../views/Index.vue';

const routes = [
  {
    path: '/', component: Index, meta: { requiresAuth: true },
    redirect: '/home',
    children: [
      { path: '/home', component: Home, meta: { requiresAuth: true } },
      { path: '/my', component: MyPage, meta: { requiresAuth: true } },
    ]
  },
  { path: '/login', component: Login, meta: { requiresAuth: false } },
  { path: '/register', component: Register, meta: { requiresAuth: false } },
  { path: '/diet', component: DietRecord, meta: { requiresAuth: true } },
  { path: '/steps', component: StepsRecord, meta: { requiresAuth: true } },
  { path: '/sleep', component: SleepRecord, meta: { requiresAuth: true } },
  { path: '/query', component: RangeQuery, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/change-password', component: ChangePassword, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫 - 认证拦截
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  // 如果路由需要认证但用户未登录
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
    return;
  }

  // 如果用户已登录但尝试访问登录/注册页面
  if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/home');
    return;
  }

  next();
});

export default router;