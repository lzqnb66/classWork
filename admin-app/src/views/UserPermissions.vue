<template>
  <div style="padding: 16px;">
    <el-page-header content="权限管理" />

    <el-card style="margin-top: 12px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>用户权限管理</span>
          <div>
            <el-button type="primary" size="small" @click="loadUsers">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
            <el-button type="success" size="small" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>创建用户
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div style="margin-bottom: 16px;">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名"
          style="width: 300px; margin-right: 12px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="用户状态" @change="handleFilter" style="width: 120px;">
          <el-option label="全部用户" value="all" />
          <el-option label="管理员" value="admin" />
          <el-option label="普通用户" value="user" />
        </el-select>
      </div>

      <el-table :data="filteredUsers" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column label="管理员权限" width="120">
          <template #default="{ row }">
            <el-switch
              :model-value="row.is_admin"
              @change="(value) => handlePermissionChange(row, value)"
              :loading="row.updating"
              :disabled="row.id === auth.user?.id"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_admin ? 'success' : 'info'">{{ row.is_admin ? '管理员' : '普通用户' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editUser(row)" :disabled="row.id === auth.user?.id">
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteUser(row)"
              :disabled="row.id === auth.user?.id"
              :loading="row.deleting"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalUsers"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-card style="margin-top: 16px;">
      <template #header>
        <span>权限说明</span>
      </template>
      <div style="color: #666; line-height: 1.6;">
        <p>• <strong>管理员</strong>：可以访问后台管理系统，管理用户和数据</p>
        <p>• <strong>普通用户</strong>：只能使用移动端应用，查看个人健康数据</p>
        <p>• 权限变更会立即生效，请谨慎操作</p>
        <p>• 不能修改自己的权限状态（安全保护）</p>
        <p>• 不能删除自己的账户（安全保护）</p>
      </div>
    </el-card>

    <!-- 创建用户对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建用户" width="500px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="管理员" prop="is_admin">
          <el-switch v-model="createForm.is_admin" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateUser" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑用户" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="管理员" prop="is_admin">
          <el-switch v-model="editForm.is_admin" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditUser" :loading="editing">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '../store/store.js';
import { usersAPI } from '../api/modules/users';

const auth = useAuthStore();
const users = ref([]);
const loading = ref(false);
const creating = ref(false);
const editing = ref(false);
const searchKeyword = ref('');
const filterStatus = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const totalUsers = ref(0);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);

// 表单相关
const createForm = reactive({
  username: '',
  password: '',
  is_admin: false
});

const editForm = reactive({
  id: null,
  username: '',
  is_admin: false
});

// 表单验证规则
const createRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const editRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
};

// 过滤后的用户列表
const filteredUsers = computed(() => {
  let filtered = users.value;
  
  // 关键词搜索
  if (searchKeyword.value) {
    filtered = filtered.filter(user => 
      user.username.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
  
  // 状态筛选
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(user => 
      filterStatus.value === 'admin' ? user.is_admin : !user.is_admin
    );
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filtered.slice(start, end);
});

async function loadUsers() {
  loading.value = true;
  try {
    const response = await usersAPI.getUsers();
    users.value = response.data.map(user => ({
      ...user,
      is_admin: Boolean(user.is_admin), // 将数字转换为布尔值
      updating: false,
      deleting: false
    }));
    totalUsers.value = users.value.length;
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载用户列表失败');
  } finally {
    loading.value = false;
  }
}

function handlePermissionChange(user, newValue) {
  // 只有在用户实际点击开关时才发送API请求
  // 这里不立即更新本地状态，等待API响应成功后再更新
  updateUserPermission(user, newValue);
}

async function updateUserPermission(user, newValue) {
  user.updating = true;
  try {
    await usersAPI.updateUserPermission(user.id, newValue);
    // API调用成功后才更新本地状态
    user.is_admin = newValue;
    ElMessage.success(`已${newValue ? '授予' : '撤销'} ${user.username} 的管理员权限`);
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '权限更新失败');
  } finally {
    user.updating = false;
  }
}

function editUser(user) {
  editForm.id = user.id;
  editForm.username = user.username;
  editForm.is_admin = user.is_admin;
  showEditDialog.value = true;
}

async function handleEditUser() {
  editing.value = true;
  try {
    await usersAPI.updateUser(editForm.id, {
      username: editForm.username,
      is_admin: editForm.is_admin
    });
    
    // 更新本地数据
    const userIndex = users.value.findIndex(u => u.id === editForm.id);
    if (userIndex !== -1) {
      users.value[userIndex].username = editForm.username;
      users.value[userIndex].is_admin = editForm.is_admin;
    }
    
    ElMessage.success('用户信息更新成功');
    showEditDialog.value = false;
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '用户信息更新失败');
  } finally {
    editing.value = false;
  }
}

async function deleteUser(user) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作将删除该用户的所有记录，且不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    user.deleting = true;
    await usersAPI.deleteUser(user.id);
    
    // 从列表中移除
    users.value = users.value.filter(u => u.id !== user.id);
    totalUsers.value = users.value.length;
    
    ElMessage.success('用户删除成功');
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e?.response?.data?.message || '用户删除失败');
    }
    user.deleting = false;
  }
}

async function handleCreateUser() {
  creating.value = true;
  try {
    await usersAPI.createUser(createForm);
    
    ElMessage.success('用户创建成功');
    showCreateDialog.value = false;
    
    // 重置表单
    createForm.username = '';
    createForm.password = '';
    createForm.is_admin = false;
    
    // 重新加载用户列表
    await loadUsers();
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '用户创建失败');
  } finally {
    creating.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
}

function handleFilter() {
  currentPage.value = 1;
}

function handleSizeChange(size) {
  pageSize.value = size;
  currentPage.value = 1;
}

function handleCurrentChange(page) {
  currentPage.value = page;
}

onMounted(() => {
  loadUsers();
});
</script>