<template>
  <div style="padding: 16px;">
    <van-cell-group inset>
      <van-field v-model="username" label="用户名" placeholder="请输入用户名" />
      <van-field v-model="password" type="password" label="密码" placeholder="请输入密码" />
    </van-cell-group>
    <div style="margin: 16px 0;">
      <van-button type="primary" block @click="doRegister">注册</van-button>
    </div>
    <van-button type="default" block @click="goLogin">去登录</van-button>
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

async function doRegister() {
  try {
    await auth.register(username.value, password.value);
    Toast('注册成功，请登录');
    router.push('/login');
  } catch (e) {
    Toast(e?.response?.data?.message || '注册失败');
  }
}

function goLogin() {
  router.push('/login');
}
</script>