<template>
  <div style="padding: 16px;">
    <el-page-header content="步数记录管理" />

    <!-- 数据筛选 -->
    <el-card style="margin-top: 12px;">
      <template #header>数据筛选</template>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <el-input v-if="auth.isAdmin" v-model="filters.userId" placeholder="用户ID（仅管理员可见）" style="width: 140px" />
        <el-input v-model="filters.minSteps" placeholder="最小步数" style="width: 120px" />
        <el-input v-model="filters.maxSteps" placeholder="最大步数" style="width: 120px" />
        <el-date-picker
          v-model="filters.startDate"
          type="date"
          placeholder="开始日期"
          value-format="YYYY-MM-DD"
        />
        <el-date-picker
          v-model="filters.endDate"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
        <el-button type="primary" @click="loadRecords">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </el-card>

    <!-- 新增步数记录 -->
    <el-card style="margin-top: 12px;">
      <template #header>新增步数记录</template>
      <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px;">
        <el-input v-if="auth.isAdmin" v-model="createForm.userId" placeholder="用户ID（管理员可指定）" />
        <el-input v-model.number="createForm.steps" placeholder="步数(必填)" />
        <el-date-picker v-model="createForm.date" type="date" placeholder="日期" value-format="YYYY-MM-DD" />
        <el-time-picker v-model="createForm.time" placeholder="时间" value-format="HH:mm:ss" />
        <el-input v-model="createForm.source" placeholder="来源（如 手动记录）" />
        <el-input v-model="createForm.notes" placeholder="备注" />
      </div>
      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <el-button type="primary" @click="submitCreate">提交</el-button>
        <el-button @click="resetCreateForm">重置</el-button>
      </div>
    </el-card>

    <!-- 步数记录列表 -->
    <el-card style="margin-top: 12px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>步数记录列表</span>
          <el-button type="primary" size="small" @click="loadRecords">刷新</el-button>
        </div>
      </template>

      <el-table :data="displayRecords" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="steps" label="步数" width="120">
          <template #default="{ row }">
            {{ row.steps ? row.steps.toLocaleString() : 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="time" label="时间" width="100" />
        <el-table-column prop="source" label="来源" width="120" />
        <el-table-column prop="notes" label="备注" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="deleteRecord(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: center;">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadRecords"
          @current-change="loadRecords"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '../store/store.js';
import { stepsAPI } from '../api/modules/steps.js';

const auth = useAuthStore();
const records = ref([]);
const loading = ref(false);

const filters = reactive({
  userId: '',
  minSteps: '',
  maxSteps: '',
  startDate: '',
  endDate: ''
});

const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

const displayRecords = computed(() => {
  return (records.value || []).map(r => ({
    id: r.id,
    userId: r.userId,
    steps: r.steps,
    date: typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0],
    time: r.time || '',
    source: r.source || '',
    notes: r.notes || ''
  }));
});

async function loadRecords() {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      limit: pagination.size
    };
    if (auth.isAdmin && filters.userId) params.userId = filters.userId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.minSteps) params.minSteps = Number(filters.minSteps);
    if (filters.maxSteps) params.maxSteps = Number(filters.maxSteps);

    const resp = await stepsAPI.getRecords(params);
    const data = resp.data;
    if (data?.success) {
      records.value = data.data?.records || [];
      const pg = data.data?.pagination || { page: 1, limit: 20, total: 0 };
      pagination.total = pg.total;
      pagination.current = pg.page;
      pagination.size = pg.limit;
    } else {
      records.value = [];
      pagination.total = 0;
    }
  } catch (e) {
    ElMessage.error(e?.message || e?.response?.data?.message || '加载步数记录失败');
  } finally {
    loading.value = false;
  }
}

async function deleteRecord(record) {
  try {
    await ElMessageBox.confirm(`确定要删除步数记录 #${record.id} 吗？`, '警告', { type: 'warning' });
    const resp = await stepsAPI.deleteRecord(record.id);
    if (resp.data?.success) {
      ElMessage.success('删除成功');
      await loadRecords();
    } else {
      ElMessage.error(resp.data?.message || '删除失败');
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || e?.response?.data?.message || '删除失败');
    }
  }
}

const createForm = reactive({
  userId: '',
  steps: null,
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().split(' ')[0],
  source: '手动记录',
  notes: ''
});

function resetCreateForm() {
  createForm.userId = '';
  createForm.steps = null;
  createForm.date = new Date().toISOString().split('T')[0];
  createForm.time = new Date().toTimeString().split(' ')[0];
  createForm.source = '手动记录';
  createForm.notes = '';
}

async function submitCreate() {
  try {
    if (createForm.steps == null || Number.isNaN(Number(createForm.steps))) {
      ElMessage.error('请填写有效的步数');
      return;
    }
    const payload = {
      steps: Number(createForm.steps),
      date: createForm.date,
      time: createForm.time,
      source: createForm.source,
      notes: createForm.notes
    };
    if (auth.isAdmin && createForm.userId) {
      payload.userId = Number(createForm.userId);
    }

    const resp = await stepsAPI.createRecord(payload);
    if (resp.data?.success) {
      ElMessage.success('创建成功');
      resetCreateForm();
      await loadRecords();
    } else {
      ElMessage.error(resp.data?.message || '创建失败');
    }
  } catch (e) {
    ElMessage.error(e?.message || e?.response?.data?.message || '创建失败');
  }
}

function resetFilters() {
  filters.userId = '';
  filters.minSteps = '';
  filters.maxSteps = '';
  filters.startDate = '';
  filters.endDate = '';
  pagination.current = 1;
  loadRecords();
}

onMounted(() => {
  loadRecords();
});
</script>