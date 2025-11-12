<template>
  <div id="app">
    <el-container v-if="$route.path !== '/login'" style="height: 100vh;">
      <el-aside width="220px" style="background-color: #304156;">
        <div style="height: 60px; display: flex; align-items: center; padding: 0 20px; color: white; font-size: 18px; font-weight: bold;">
          <i class="el-icon-monitor" style="margin-right: 10px;"></i>
          健康管理系统
        </div>
        <el-menu
          :default-active="$route.path"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          router
          style="border-right: none;"
        >
          <!-- <el-menu-item index="/dashboard">
            <i class="el-icon-data-line"></i>
            <span>仪表盘</span>
          </el-menu-item> -->
          <el-submenu index="2">
            <template #title>
              <i class="el-icon-user"></i>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/users">用户列表</el-menu-item>
            <el-menu-item index="/user-permissions">权限管理</el-menu-item>
          </el-submenu>
          <el-submenu index="3">
            <template #title>
              <i class="el-icon-first-aid-kit"></i>
              <span>健康数据</span>
            </template>
            <el-menu-item index="/diet-records">饮食记录</el-menu-item>
            <el-menu-item index="/steps-records">步数记录</el-menu-item>
            <el-menu-item index="/sleep-records">睡眠记录</el-menu-item>
          </el-submenu>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header style="background: white; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
          <div style="font-size: 16px; font-weight: 500;">{{ pageTitle }}</div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span>欢迎，{{ auth.user?.username }}</span>
            <el-button size="small" @click="logout">退出登录</el-button>
          </div>
        </el-header>
        <el-main style="padding: 20px; background: #f5f7fa;">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './store/store.js';
import { ElMessageBox, ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const pageTitle = computed(() => {
  const titles = {
    '/dashboard': '仪表盘',
    '/users': '用户管理',
    '/user-permissions': '权限管理',
    '/diet-records': '饮食记录管理',
    '/steps-records': '步数记录管理',
    '/sleep-records': '睡眠记录管理'
  };
  return titles[route.path] || '健康管理系统';
});

const logout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' });
    auth.logout();
    router.push('/login');
    ElMessage.success('已退出登录');
  } catch {
    // 用户取消
  }
};
</script>

<style>
html, body, #app { height: 100%; margin: 0; }
#app { font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; }

.el-menu {
  border-right: none !important;
}

.el-menu-item {
  height: 46px !important;
  line-height: 46px !important;
}

.el-submenu .el-menu-item {
  min-width: 0 !important;
  padding-left: 50px !important;
}
</style>