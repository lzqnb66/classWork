<template>
  <div class="change-password-page">
    <van-nav-bar title="修改密码" left-text="返回" left-arrow @click-left="$router.back()" />

    <div class="module-content">
      <!-- 密码修改表单 -->
      <van-cell-group inset>
        <van-field
          v-model="passwordForm.oldPassword"
          label="旧密码"
          placeholder="请输入当前密码"
          :type="showOldPassword ? 'text' : 'password'"
          :right-icon="showOldPassword ? 'eye-o' : 'closed-eye'"
          @click-right-icon="showOldPassword = !showOldPassword"
        />
        
        <van-field
          v-model="passwordForm.newPassword"
          label="新密码"
          placeholder="请输入新密码"
          :type="showNewPassword ? 'text' : 'password'"
          :right-icon="showNewPassword ? 'eye-o' : 'closed-eye'"
          @click-right-icon="showNewPassword = !showNewPassword"
          :error-message="passwordErrors.newPassword"
        />
        
        <van-field
          v-model="passwordForm.confirmPassword"
          label="确认密码"
          placeholder="请再次输入新密码"
          :type="showConfirmPassword ? 'text' : 'password'"
          :right-icon="showConfirmPassword ? 'eye-o' : 'closed-eye'"
          @click-right-icon="showConfirmPassword = !showConfirmPassword"
          :error-message="passwordErrors.confirmPassword"
        />
      </van-cell-group>

      <!-- 密码复杂度提示 -->
      <div class="password-tips">
        <div class="tip-title">密码要求：</div>
        <div :class="['tip-item', isLengthValid ? 'valid' : 'invalid']">
          <van-icon :name="isLengthValid ? 'success' : 'cross'" />
          至少8个字符
        </div>
        <div :class="['tip-item', hasUpperCase ? 'valid' : 'invalid']">
          <van-icon :name="hasUpperCase ? 'success' : 'cross'" />
          包含大写字母
        </div>
        <div :class="['tip-item', hasLowerCase ? 'valid' : 'invalid']">
          <van-icon :name="hasLowerCase ? 'success' : 'cross'" />
          包含小写字母
        </div>
        <div :class="['tip-item', hasNumber ? 'valid' : 'invalid']">
          <van-icon :name="hasNumber ? 'success' : 'cross'" />
          包含数字
        </div>
        <div :class="['tip-item', hasSpecialChar ? 'valid' : 'invalid']">
          <van-icon :name="hasSpecialChar ? 'success' : 'cross'" />
          包含特殊字符 (!@#$%^&*)
        </div>
      </div>

      <div style="padding: 0 16px; margin: 24px 0;">
        <van-button 
          type="primary" 
          size="large" 
          :loading="changing" 
          :disabled="!isFormValid"
          @click="changePassword"
        >
          确认修改
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showSuccessToast, showFailToast, showConfirmDialog } from 'vant';
import { useAuthStore } from '../store/auth';
import * as profileApi from '../api/profile';

const auth = useAuthStore();
const router = useRouter();
const changing = ref(false);
const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const passwordErrors = reactive({
  newPassword: '',
  confirmPassword: ''
});

// 密码复杂度检查
const isLengthValid = computed(() => passwordForm.newPassword.length >= 8);
const hasUpperCase = computed(() => /[A-Z]/.test(passwordForm.newPassword));
const hasLowerCase = computed(() => /[a-z]/.test(passwordForm.newPassword));
const hasNumber = computed(() => /\d/.test(passwordForm.newPassword));
const hasSpecialChar = computed(() => /[!@#$%^&*]/.test(passwordForm.newPassword));

// 表单验证
const isPasswordValid = computed(() => 
  isLengthValid.value && 
  hasUpperCase.value && 
  hasLowerCase.value && 
  hasNumber.value && 
  hasSpecialChar.value
);

const isFormValid = computed(() => 
  passwordForm.oldPassword && 
  passwordForm.newPassword && 
  passwordForm.confirmPassword &&
  passwordForm.newPassword === passwordForm.confirmPassword &&
  isPasswordValid.value
);

// 监听密码输入并验证
watch(() => passwordForm.newPassword, (newVal) => {
  if (newVal && passwordForm.confirmPassword && newVal !== passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = '两次输入的密码不一致';
  } else {
    passwordErrors.confirmPassword = '';
  }
  
  if (newVal && !isPasswordValid.value) {
    passwordErrors.newPassword = '密码复杂度不足';
  } else {
    passwordErrors.newPassword = '';
  }
});

watch(() => passwordForm.confirmPassword, (newVal) => {
  if (newVal && passwordForm.newPassword && newVal !== passwordForm.newPassword) {
    passwordErrors.confirmPassword = '两次输入的密码不一致';
  } else {
    passwordErrors.confirmPassword = '';
  }
});

async function changePassword() {
  if (!isFormValid.value) return;
  
  changing.value = true;
  try {
    await profileApi.changePassword({
      old_password: passwordForm.oldPassword,
      new_password: passwordForm.newPassword
    });
    
    showSuccessToast('密码修改成功');
    
    // 清空表单
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    
    // 返回上一页
    setTimeout(() => {
      router.back();
    }, 1500);
    
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    if (message.includes('旧密码')) {
      showFailToast('旧密码不正确');
    } else {
      showFailToast('密码修改失败: ' + message);
    }
  } finally {
    changing.value = false;
  }
}
</script>

<style scoped>
.change-password-page { min-height: 100vh; background: #f7f8fa; }
.module-content { padding: 16px; }

.password-tips {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.tip-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #323233;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 8px;
}

.tip-item.valid {
  color: #07c160;
}

.tip-item.invalid {
  color: #ee0a24;
}

/* 表单布局响应式 */
@media (min-width: 480px) {
  .module-content { max-width: 520px; margin: 0 auto; }
}
</style>