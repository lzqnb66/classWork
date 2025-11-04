<template>
  <div style="padding: 16px;">
    <van-cell-group inset>
      <van-field v-model="username" label="用户名" placeholder="请输入用户名" />
      <van-field v-model="password" type="password" label="密码" placeholder="请输入密码" />
    </van-cell-group>
    <div style="margin: 16px 0;">
      <van-button type="primary" block @click="doLogin">登录</van-button>
    </div>
    <van-button type="default" block @click="goRegister">去注册</van-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { Toast } from 'vant';

const router = useRouter();
const auth = useAuthStore();
const username = ref('');
const password = ref('');

async function doLogin() {
  try {
    await auth.login(username.value, password.value);
    Toast('登录成功');
    router.push('/home');
  } catch (e) {
    Toast(e?.response?.data?.message || '登录失败');
  }
}

function goRegister() {
  router.push('/register');
}
</script>