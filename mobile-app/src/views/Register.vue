<template>
  <div class="page-container">
    <div class="header">
      <van-nav-bar
        title="注册账号"
        left-arrow
        @click-left="goLogin"
      />
    </div>
    <div class="register-container">
      <van-form @submit="doRegister" class="register-form">
        <div class="form-intro">
          <h3>欢迎加入健康管理助手</h3>
          <p>记录健康数据，开启智能分析</p>
        </div>

        <van-cell-group inset>
          <van-field
            v-model="username"
            name="username"
            left-icon="user-o"
            label="用户名"
            label-width="4em"
            placeholder="请设置用户名"
            :rules="[{ required: true, message: '请填写用户名' }]"
          />
          <van-field
            v-model="password"
            type="password"
            name="password"
            left-icon="lock"
            label="密码"
            label-width="4em"
            placeholder="请设置密码"
            :rules="[
              { required: true, message: '请填写密码' },
              { min: 6, message: '密码不能少于6位' }
            ]"
          />
        </van-cell-group>

        <div class="button-group">
          <van-button 
            round 
            block 
            type="primary" 
            native-type="submit"
            size="large"
          >完成注册</van-button>
          <van-button 
            round 
            block 
            plain 
            type="primary" 
            @click="goLogin"
            size="large"
          >返回登录</van-button>
        </div>

        <div class="terms">
          注册即表示同意 <span class="link">用户协议</span> 和 <span class="link">隐私政策</span>
        </div>
      </van-form>
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

async function doRegister() {
  try {
    await auth.register(username.value, password.value);
    showToast('注册成功，请登录');
    router.push('/login');
  } catch (e) {
    showToast(e?.response?.data?.message || '注册失败');
  }
}

function goLogin() {
  router.push('/login');
}
</script>

<style scoped>
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  flex-shrink: 0;
}

.register-container {
  flex: 1;
  background: linear-gradient(to bottom, #f0f9ff, #ffffff);
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.form-intro {
  text-align: center;
  padding: 20px 0;
  
  h3 {
    color: #2c3e50;
    font-size: 24px;
    margin-bottom: 8px;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
}

.register-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
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

.terms {
  margin-top: auto;
  text-align: center;
  font-size: 12px;
  color: #999;
  padding-bottom: 20px;
  
  .link {
    color: #4fc08d;
  }
}
</style>