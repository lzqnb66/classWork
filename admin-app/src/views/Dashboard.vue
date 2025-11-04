<template>
  <div style="padding:16px;">
    <el-page-header content="健康管理后台" />

    <el-card style="margin-top:12px;">
      <template #header>数据筛选</template>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <el-input v-model="filters.userId" placeholder="用户ID" style="width:160px" />
        <el-select v-model="filters.type" placeholder="类型" style="width:160px">
          <el-option label="全部" value="" />
          <el-option label="步数" value="steps" />
          <el-option label="睡眠" value="sleep" />
          <el-option label="饮食" value="diet" />
        </el-select>
        <el-date-picker v-model="filters.startDate" type="date" placeholder="开始日期" />
        <el-date-picker v-model="filters.endDate" type="date" placeholder="结束日期" />
        <el-button type="primary" @click="loadRecords">查询</el-button>
      </div>
    </el-card>

    <el-card style="margin-top:12px;">
      <template #header>记录列表</template>
      <el-table :data="records" style="width: 100%" size="small">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="date" label="日期" width="140" />
        <el-table-column prop="steps" label="步数" width="140" />
        <el-table-column prop="sleep_hours" label="睡眠(小时)" width="140" />
        <el-table-column prop="food_name" label="食物" />
        <el-table-column prop="calories" label="热量" width="120" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-top:12px;">
      <template #header>用户列表</template>
      <el-table :data="users" style="width: 100%" size="small">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column label="管理员" width="120">
          <template #default="{ row }">
            <el-tag :type="row.is_admin ? 'success' : 'info'">{{ row.is_admin ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const filters = ref({ userId: '', type: '', startDate: '', endDate: '' });
const records = ref([]);
const users = ref([]);

async function loadRecords() {
  try {
    const { data } = await auth.api().get('/admin/records', {
      params: {
        userId: filters.value.userId || undefined,
        type: filters.value.type || undefined,
        startDate: formatDate(filters.value.startDate),
        endDate: formatDate(filters.value.endDate),
      }
    });
    records.value = data;
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '查询失败');
  }
}

async function loadUsers() {
  try {
    const { data } = await auth.api().get('/admin/users');
    users.value = data;
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载用户失败');
  }
}

function formatDate(d) {
  if (!d) return undefined;
  try {
    const md = new Date(d);
    return md.toISOString().slice(0,10);
  } catch { return undefined; }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(`确认删除记录 #${row.id} ?`, '提示', { type: 'warning' });
    await auth.api().delete(`/admin/records/${row.id}`);
    ElMessage.success('删除成功');
    await loadRecords();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.response?.data?.message || '删除失败');
  }
}

// 初始化加载
loadUsers();
loadRecords();
</script>