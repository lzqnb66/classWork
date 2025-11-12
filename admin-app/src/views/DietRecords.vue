<template>
  <div style="padding: 16px;">
    <el-page-header content="饮食记录管理" />

    <!-- 数据筛选 -->
    <el-card style="margin-top: 12px;">
      <template #header>数据筛选</template>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <el-input v-model="filters.userId" placeholder="用户ID" style="width: 120px" />
        <el-input v-model="filters.foodName" placeholder="食物名称" style="width: 180px" />
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

    <!-- 新增饮食记录 -->
    <el-card style="margin-top: 12px;">
      <template #header>新增饮食记录</template>
      <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px;">
        <el-input v-if="auth.isAdmin" v-model="createForm.userId" placeholder="用户ID（管理员可指定）" />
        <el-input v-model="createForm.foodName" placeholder="食物名称" />
        <el-input v-model.number="createForm.calories" placeholder="热量(卡)" />
        <el-input v-model.number="createForm.protein" placeholder="蛋白质(g)" />
        <el-input v-model.number="createForm.carbs" placeholder="碳水(g)" />
        <el-input v-model.number="createForm.fat" placeholder="脂肪(g)" />
        <el-select v-model="createForm.mealType" placeholder="餐次">
          <el-option label="早餐" value="breakfast" />
          <el-option label="午餐" value="lunch" />
          <el-option label="晚餐" value="dinner" />
          <el-option label="加餐" value="snack" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-input v-model.number="createForm.quantity" placeholder="份数" />
        <el-input v-model="createForm.unit" placeholder="单位" />
        <el-date-picker v-model="createForm.date" type="date" placeholder="日期" value-format="YYYY-MM-DD" />
        <el-time-picker v-model="createForm.time" placeholder="时间" value-format="HH:mm:ss" />
      </div>
      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <el-button type="primary" @click="submitCreate">提交</el-button>
        <el-button @click="resetCreateForm">重置</el-button>
      </div>
    </el-card>

    <!-- 饮食记录列表 -->
    <el-card style="margin-top: 12px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>饮食记录列表</span>
          <el-button type="primary" size="small" @click="loadRecords">刷新</el-button>
        </div>
      </template>

      <el-table :data="displayRecords" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="foodName" label="食物名称" />
        <el-table-column prop="calories" label="热量(卡)" width="100" />
        <el-table-column prop="date" label="日期" width="120" />
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
import { dietAPI } from '../api/modules/diet.js';

const auth = useAuthStore();
const records = ref([]);
const loading = ref(false);

const filters = reactive({
  userId: '',
  foodName: '',
  startDate: '',
  endDate: ''
});

const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

const summaryDate = ref(new Date().toISOString().split('T')[0]);
const summary = reactive({
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0
});

async function loadSummary() {
  try {
    const params = {
      date: summaryDate.value
    };
    if (filters.userId) {
      params.userId = filters.userId;
    }
    const resp = await dietAPI.getSummary(params);
    if (resp.data?.success) {
      const stats = resp.data?.data?.totalStats || {};
      summary.totalCalories = Number(stats.totalCalories || 0);
      summary.totalProtein = Number(stats.totalProtein || 0);
      summary.totalCarbs = Number(stats.totalCarbs || 0);
      summary.totalFat = Number(stats.totalFat || 0);
    } else {
      summary.totalCalories = 0;
      summary.totalProtein = 0;
      summary.totalCarbs = 0;
      summary.totalFat = 0;
    }
  } catch (e) {
    ElMessage.error(e?.message || e?.response?.data?.message || '统计数据加载失败');
  }
}

async function loadRecords() {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      limit: pagination.size
    };
    if (filters.userId) params.userId = filters.userId;
    if (filters.foodName) params.foodName = filters.foodName.trim();
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    // 后端diet接口按当前登录用户返回记录；如管理员且传了userId，则查询指定用户
    const response = await dietAPI.getRecords(params);
    // 统一响应封装：response = { success, status, data }
    const data = response.data;
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
    ElMessage.error(e?.message || e?.response?.data?.message || '加载饮食记录失败');
  } finally {
    loading.value = false;
  }
}

async function deleteRecord(record) {
  try {
    await ElMessageBox.confirm(
      `确定要删除饮食记录 #${record.id} 吗？`,
      '警告',
      { type: 'warning' }
    );

    const resp = await dietAPI.deleteRecord(record.id);
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

function resetFilters() {
  filters.userId = '';
  filters.foodName = '';
  filters.startDate = '';
  filters.endDate = '';
  pagination.current = 1;
  loadRecords();
}

onMounted(() => {
  loadRecords();
  loadSummary();
});

// 显示用数据（格式化日期等）
const displayRecords = computed(() => {
  return (records.value || []).map(r => ({
    id: r.id,
    userId: r.userId,
    foodName: r.foodName,
    calories: r.calories,
    date: (typeof r.date === 'string') ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]
  }));
});

const createForm = reactive({
  userId: '',
  foodName: '',
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  mealType: 'other',
  quantity: 1,
  unit: '份',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().split(' ')[0]
});

function resetCreateForm() {
  createForm.userId = '';
  createForm.foodName = '';
  createForm.calories = null;
  createForm.protein = null;
  createForm.carbs = null;
  createForm.fat = null;
  createForm.mealType = 'other';
  createForm.quantity = 1;
  createForm.unit = '份';
  createForm.date = new Date().toISOString().split('T')[0];
  createForm.time = new Date().toTimeString().split(' ')[0];
}

async function submitCreate() {
  try {
    if (!createForm.foodName || createForm.calories == null) {
      ElMessage.error('请填写食物名称和热量');
      return;
    }
    const payload = {
      foodName: createForm.foodName.trim(),
      calories: Number(createForm.calories),
      protein: createForm.protein != null ? Number(createForm.protein) : undefined,
      carbs: createForm.carbs != null ? Number(createForm.carbs) : undefined,
      fat: createForm.fat != null ? Number(createForm.fat) : undefined,
      mealType: createForm.mealType || 'other',
      quantity: Number(createForm.quantity) || 1,
      unit: createForm.unit || '份',
      date: createForm.date,
      time: createForm.time
    };
    if (auth.isAdmin && createForm.userId) {
      payload.userId = Number(createForm.userId);
    }

    const resp = await dietAPI.createRecord(payload);
    if (resp.data?.success) {
      ElMessage.success('创建成功');
      resetCreateForm();
      await loadRecords();
      await loadSummary();
    } else {
      ElMessage.error(resp.data?.message || '创建失败');
    }
  } catch (e) {
    ElMessage.error(e?.message || e?.response?.data?.message || '创建失败');
  }
}
</script>