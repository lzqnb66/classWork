<template>
  <div>
    <div style="padding: 16px;">
      <!-- 用户信息头部 -->
      <div class="user-header">
        <div class="avatar-wrapper">
          <img 
            v-if="avatarUrl" 
            :src="avatarUrl" 
            alt="用户头像" 
            class="avatar"
          />
          <div v-else class="avatar-default">
            <van-icon name="user-o" size="32" />
          </div>
        </div>
        <div class="user-info">
          <div class="username">{{ userInfo.fullname || userInfo.username || '未登录用户' }}</div>
          <div class="welcome-text">欢迎使用健康管理系统</div>
        </div>
      </div>
      
      <div style="height: 20px" />
      <!-- 用户信息卡片 -->
      <van-cell-group inset style="margin-bottom: 20px;">
        <van-cell title="个人信息" is-link @click="$router.push('/profile')">
          <template #icon>
            <van-icon name="user-o" size="20" style="margin-right: 8px; color: #1989fa;" />
          </template>
        </van-cell>
        
        <van-cell title="修改密码" is-link @click="$router.push('/change-password')">
          <template #icon>
            <van-icon name="lock" size="20" style="margin-right: 8px; color: #ff976a;" />
          </template>
        </van-cell>
        
        <van-cell title="退出登录" @click="handleLogout">
          <template #icon>
            <van-icon name="close" size="20" style="margin-right: 8px; color: #ee0a24;" />
          </template>
        </van-cell>
      </van-cell-group>
      
      <!-- 功能说明区域 -->
      <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #1a1a1a;">
          健康管理
        </div>
        <div style="font-size: 14px; color: #666; line-height: 1.5;">
          在这里您可以管理个人信息、修改密码，以及安全退出登录。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { showConfirmDialog, showSuccessToast, showFailToast } from 'vant';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';
import * as profileApi from '../api/profile';

const auth = useAuthStore();
const router = useRouter();
const avatarUrl = ref('');

const userInfo = reactive({
  username: auth.user?.username || '未登录用户',
  fullname: '',
  email: auth.user?.email || ''
});

onMounted(async () => {
  try {
    // 获取用户资料信息
    const data = await profileApi.getProfile();
    if (data) {
      Object.assign(userInfo, data);
      avatarUrl.value = data?.avatar_url || '';
    }
  } catch (e) {
    // 如果API调用失败，尝试从本地存储获取
    try {
      const saved = JSON.parse(localStorage.getItem('profile') || '{}');
      Object.assign(userInfo, saved || {});
      avatarUrl.value = localStorage.getItem('avatar_url') || '';
    } catch {}
  }
});

async function handleLogout() {
  try {
    await showConfirmDialog({
      title: '确认退出',
      message: '您确定要退出登录吗？',
      confirmButtonText: '确认退出',
      cancelButtonText: '取消'
    });
    
    // 调用退出登录
    await auth.logout();
    
    // 跳转到登录页
    router.replace('/login');
    showSuccessToast('已安全退出');
    
  } catch (error) {
    // 用户取消了操作
    if (error !== 'cancel') {
      showFailToast('退出失败');
    }
  }
}
</script>

<style scoped>
/* 用户信息头部样式 */
.user-header {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #5C7AEA, #70A1FF);
  padding: 20px 16px;
  border-radius: 16px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(92, 122, 234, 0.3);
}

.avatar-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  margin-right: 16px;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-default {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.user-info {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.welcome-text {
  font-size: 14px;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.van-cell {
  padding: 16px;
  font-size: 16px;
}

.van-cell:active {
  background-color: #f5f5f5;
}
</style>