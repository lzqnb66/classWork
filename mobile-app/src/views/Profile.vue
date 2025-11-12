<template>
  <div class="profile-page">
    <van-nav-bar
      title="个人资料"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="module-content">
      <!-- 头像上传 -->
      <div class="avatar-section">
        <div class="avatar-uploader">
          <van-uploader
            :after-read="onAvatarRead"
            :max-size="1024 * 1024"
            @oversize="onOversize"
          >
            <div class="avatar-wrapper">
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                alt="头像"
                class="avatar"
              />
              <van-icon v-else name="user-circle-o" class="avatar-default" />
            </div>
          </van-uploader>
          <van-icon name="photograph" class="upload-icon" />
        </div>
        <div class="avatar-tips">点击头像可上传新照片 (最大1MB)</div>
      </div>

      <!-- 基本信息 -->
      <van-cell-group inset>
        <van-cell title="姓名" :value="userForm.fullname || '未设置'" />
        <van-cell title="手机号" :value="userForm.phone || '未设置'" />
        <van-cell title="邮箱" :value="userForm.email || '未设置'" />
      </van-cell-group>

      <!-- 编辑表单 -->
      <van-form @submit="saveProfile">
        <van-cell-group inset>
          <van-field
            v-model="userForm.fullname"
            name="fullname"
            label="姓名"
            placeholder="请输入姓名"
            :rules="[{ required: true, message: '请输入姓名' }]"
          />
          <van-field
            v-model="userForm.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            :rules="[
              { validator: validatePhone, message: '请输入正确的手机号' },
            ]"
          />
          <van-field
            v-model="userForm.email"
            name="email"
            label="邮箱"
            placeholder="请输入邮箱"
            :rules="[
              { validator: validateEmail, message: '请输入正确的邮箱格式' },
            ]"
          />
          <van-field
            v-model="userForm.address"
            name="address"
            label="地址"
            placeholder="请输入详细地址"
          />
          <van-field
            v-model="userForm.city"
            name="city"
            label="城市"
            placeholder="请输入城市"
          />
          <van-field
            v-model="userForm.postcode"
            name="postcode"
            label="邮编"
            placeholder="请输入邮编"
          />
        </van-cell-group>

        <div style="margin: 16px">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="saving"
          >
            保存修改
          </van-button>
        </div>
      </van-form>
      <!-- 安全提示 -->
      <div class="security-tip">
        <div class="tip-title">安全提示</div>
        <div class="tip-content">
          我们不会在日志中记录您的隐私数据，资料仅用于个性化服务。请勿上传敏感信息。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { showFailToast, showSuccessToast, showConfirmDialog } from "vant";
import { useAuthStore } from "../store/auth";
import * as profileApi from "../api/profile";

const auth = useAuthStore();
const saving = ref(false);
const avatarUrl = ref("");

// 选择器状态
const showGenderPicker = ref(false);
const showBirthdayPicker = ref(false);
const showBloodTypePicker = ref(false);

// 选择器选项
const genderOptions = [
  { text: "请选择", value: "" },
  { text: "男", value: "male" },
  { text: "女", value: "female" },
  { text: "其他", value: "other" },
];

const bloodTypeOptions = [
  { text: "请选择", value: "" },
  { text: "A型", value: "A" },
  { text: "B型", value: "B" },
  { text: "AB型", value: "AB" },
  { text: "O型", value: "O" },
];

// 日期范围
const minDate = new Date(1900, 0, 1);
const maxDate = new Date();

const userForm = reactive({
  username: auth.user?.username || "未登录用户",
  fullname: "",
  phone: "",
  email: auth.user?.email || "",
  address: "",
  city: "",
  postcode: "",
  gender: "",
  birthday: "",
  height: "",
  weight: "",
  emergency_contact: "",
  emergency_phone: "",
  blood_type: "",
  allergies: "",
  medical_conditions: "",
});

onMounted(async () => {
  try {
    const data = await profileApi.getProfile();
    if (data) {
      // 只赋值存在的字段，避免覆盖默认值
      Object.keys(userForm).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
          userForm[key] = data[key];
        }
      });
      avatarUrl.value = data?.avatar_url || "";
    }
  } catch (e) {
    console.error("获取个人资料失败:", e);
    try {
      const saved = JSON.parse(localStorage.getItem("profile") || "{}");
      Object.assign(userForm, saved || {});
      avatarUrl.value = localStorage.getItem("avatar_url") || "";
    } catch {}
  }
});

// 选择器确认处理函数
const onGenderConfirm = ({ selectedOptions }) => {
  userForm.gender = selectedOptions[0]?.value || "";
  showGenderPicker.value = false;
};

const onBirthdayConfirm = ({ selectedValues }) => {
  userForm.birthday = selectedValues.join("-");
  showBirthdayPicker.value = false;
};

const onBloodTypeConfirm = ({ selectedOptions }) => {
  userForm.blood_type = selectedOptions[0]?.value || "";
  showBloodTypePicker.value = false;
};

async function saveProfile() {
  const err = validate();
  console.log(err)
  if (err) return showFailToast(err);
  saving.value = true;
  try {
    await profileApi.updateProfile({ ...userForm });
    showSuccessToast("资料已保存");
  } catch (e) {
    localStorage.setItem("profile", JSON.stringify({ ...userForm }));
    showSuccessToast("资料已保存(本地)");
  } finally {
    saving.value = false;
  }
}

function onAvatarRead(file) {
  const blob = file?.file || file;
  if (!blob) return showFailToast("选择头像失败");
  if (blob.size > 2 * 1024 * 1024) return showFailToast("头像大小不能超过2MB");
  profileApi
    .uploadAvatar(blob)
    .then((res) => {
      avatarUrl.value = res?.avatar_url || "";
      showSuccessToast("头像已更新");
    })
    .catch(() => {
      const reader = new FileReader();
      reader.onload = () => {
        avatarUrl.value = reader.result;
        localStorage.setItem("avatar_url", avatarUrl.value);
        showSuccessToast("头像已更新(本地)");
      };
      reader.onerror = () => showFailToast("头像读取失败");
      reader.readAsDataURL(blob);
    });
}
function resetForm() {
  userForm.fullname = "";
  userForm.phone = "";
  userForm.email = auth.user?.email || "";
  userForm.address = "";
  userForm.city = "";
  userForm.postcode = "";
}

// 验证函数
function validatePhone(val) {
  return !val || /^1[3-9]\d{9}$/.test(val);
}

function validateEmail(val) {
  return !val || /^\S+@\S+\.\S+$/.test(val);
}

function validatePostcode(val) {
  return !val || /^\d{4,10}$/.test(val);
}

function validateHeight(val) {
  return !val || (val >= 50 && val <= 250);
}

function validateWeight(val) {
  return !val || (val >= 20 && val <= 300);
}

function validateEmergencyPhone(val) {
  return !val || /^1[3-9]\d{9}$/.test(val);
}

function validate() {
  if (userForm.fullname && userForm.fullname.length > 50) return "姓名过长";
  if (userForm.phone && !validatePhone(userForm.phone))
    return "手机号格式不正确";
  console.log(userForm.email && !validateEmail(userForm.email))
  if (userForm.email && !validateEmail(userForm.email)) return "邮箱格式不正确";
  if (userForm.postcode && !validatePostcode(userForm.postcode))
    return "邮编格式不正确";
  if (userForm.height && !validateHeight(userForm.height))
    return "身高应在50-250cm之间";
  if (userForm.weight && !validateWeight(userForm.weight))
    return "体重应在20-300kg之间";
  if (
    userForm.emergency_phone &&
    !validateEmergencyPhone(userForm.emergency_phone)
  )
    return "紧急联系人电话格式不正确";
  return "";
}

async function handleLogout() {
  try {
    await showConfirmDialog({
      title: "确认退出",
      message: "您确定要退出登录吗？",
      confirmButtonText: "确认退出",
      cancelButtonText: "取消",
    });

    // 调用退出登录
    await auth.logout();

    // 跳转到登录页
    $router.replace("/login");
    showSuccessToast("已安全退出");
  } catch (error) {
    // 用户取消了操作
    if (error !== "cancel") {
      showFailToast("退出失败");
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f7f8fa;
}
.module-content {
  padding: 16px;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.avatar-section {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 12px;
}

.avatar-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f3f5;
  border: 1px dashed #ddd;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-wrapper:hover {
  border-color: #1989fa;
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.15);
}

.avatar-uploader {
   position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f3f5;
  border: 1px dashed #ddd;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-tips {
  font-size: 12px;
  color: #969799;
  margin-bottom: 16px;
}
.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar.placeholder {
  font-size: 12px;
  color: #969799;
}
.avatar-default {
  font-size: 36px;
  color: #c8c9cc;
}

.upload-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #1989fa;
  color: white;
  border-radius: 50%;
  padding: 4px;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  z-index: 10;
}

.avatar-wrapper:hover .upload-icon {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
.basic-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.username {
  font-weight: 600;
  font-size: 16px;
}
.email {
  font-size: 12px;
  color: #666;
}
.security-tip {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
}
.tip-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.tip-content {
  font-size: 12px;
  color: #666;
}

/* 表单布局响应式 */
@media (min-width: 480px) {
  .module-content {
    max-width: 520px;
    margin: 0 auto;
  }
}
</style>
