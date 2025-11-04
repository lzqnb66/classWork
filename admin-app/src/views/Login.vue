<template>
  <div style="max-width:420px;margin:40px auto;">
    <el-card>
      <template #header>
        <div class="card-header">管理员登录</div>
      </template>
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="login">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const auth = useAuthStore();
const form = reactive({ username: '', password: '' });

async function login() {
  try {
    await auth.login(form.username, form.password);
    ElMessage.success('登录成功');
    router.push('/dashboard');
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e?.message || '登录失败');
  }
}
</script>

<style scoped>
.card-header { font-weight: 600; }
</style>