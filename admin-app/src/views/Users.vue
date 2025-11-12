<template>
  <div style="padding: 16px;">
    <el-page-header content="用户管理" />

    <el-card style="margin-top: 12px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>用户列表</span>
          <el-button type="primary" size="small" @click="loadUsers">刷新</el-button>
        </div>
      </template>

      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column label="管理员" width="120">
          <template #default="{ row }">
            <el-tag :type="row.is_admin ? 'success' : 'info'">{{ row.is_admin ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="editUser(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editDialogVisible" :title="editDialogTitle" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="管理员">
          <el-switch v-model="editForm.is_admin" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '../store/store.js';
import { usersAPI } from '../api/modules/users';

const auth = useAuthStore();
const users = ref([]);
const loading = ref(false);
const editDialogVisible = ref(false);
const saving = ref(false);
const editForm = ref({
  id: '',
  username: '',
  is_admin: false
});

const editDialogTitle = ref('编辑用户');

async function loadUsers() {
  loading.value = true;
  try {
    const response = await usersAPI.getUsers();
    users.value = response.data;
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载用户列表失败');
  } finally {
    loading.value = false;
  }
}

function editUser(user) {
  editForm.value = {
    id: user.id,
    username: user.username,
    is_admin: !!user.is_admin
  };
  editDialogVisible.value = true;
}

async function saveUser() {
  saving.value = true;
  try {
    await usersAPI.updateUser(editForm.value.id, {
      is_admin: editForm.value.is_admin
    });
    ElMessage.success('用户信息已更新');
    editDialogVisible.value = false;
    await loadUsers();
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function deleteUser(user) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '警告',
      { type: 'warning' }
    );
    
    await usersAPI.deleteUser(user.id);
    ElMessage.success('用户已删除');
    await loadUsers();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e?.response?.data?.message || '删除失败');
    }
  }
}

onMounted(() => {
  loadUsers();
});
</script>