<template>
  <div class="login-container">
    <div class="header">
      <van-image
        width="80"
        height="80"
        src="/health-logo.png"
        class="logo"
      />
      <h2 class="app-name">健康管理助手</h2>
      <p class="slogan">您的私人健康数据管家</p>
    </div>

    <van-form @submit="doLogin" class="login-form">
      <van-cell-group inset>
        <van-field
          v-model="username"
          name="username"
          left-icon="user-o"
          label="账号"
          label-width="3.5em"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请填写用户名' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          left-icon="lock"
          label="密码"
          label-width="3.5em"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
      </van-cell-group>

      <div class="button-group">
        <van-button 
          round 
          block 
          type="primary" 
          native-type="submit"
          size="large"
        >登 录</van-button>
        <van-button 
          round 
          block 
          plain 
          type="primary" 
          @click="goRegister"
          size="large"
        >注册账号</van-button>
      </div>
    </van-form>

    <div class="footer">
      <p>开启您的健康管理之旅</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { showToast } from 'vant';

const router = useRouter();
const auth = useAuthStore();
const username = ref('');
const password = ref('');

async function doLogin() {
  try {
    await auth.login(username.value, password.value);
    showToast('登录成功');
    router.push('/home');
  } catch (e) {
    showToast(e?.response?.data?.message || '登录失败');
  }
}

function goRegister() {
  router.push('/register');
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  height: 100vh;
  background: linear-gradient(to bottom, #f0f9ff, #ffffff);
  padding: 20px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  margin-bottom: 16px;
}

.app-name {
  color: #2c3e50;
  font-size: 24px;
  margin-bottom: 8px;
}

.slogan {
  color: #666;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

.button-group {
  margin-top: 32px;
  
  .van-button {
    margin-bottom: 12px;
    height: 44px;
    font-size: 16px;
    
    &--primary {
      background: #4fc08d;
      border-color: #4fc08d;
    }
  }
}

.footer {
  margin-top: auto;
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 20px 0;
}
</style>