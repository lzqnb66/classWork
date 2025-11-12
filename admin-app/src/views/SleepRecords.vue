<template>
  <div style="padding: 16px;">
    <el-page-header content="睡眠记录管理" />

    <!-- 数据筛选 -->
    <el-card style="margin-top: 12px;">
      <template #header>数据筛选</template>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <el-input v-if="auth.isAdmin" v-model="filters.userId" placeholder="用户ID（仅管理员可见）" style="width: 140px" />
        <el-input v-model="filters.minHours" placeholder="最小小时" style="width: 120px" />
        <el-input v-model="filters.maxHours" placeholder="最大小时" style="width: 120px" />
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

    <!-- 新增睡眠记录 -->
    <el-card style="margin-top: 12px;">
      <template #header>新增睡眠记录</template>
      <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px;">
        <el-input v-if="auth.isAdmin" v-model="createForm.userId" placeholder="用户ID（管理员可指定）" />
        <el-date-picker v-model="createForm.startTime" type="datetime" placeholder="开始时间" value-format="YYYY-MM-DD HH:mm:ss" />
        <el-date-picker v-model="createForm.endTime" type="datetime" placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
        <el-select v-model="createForm.quality" placeholder="睡眠质量">
          <el-option label="极好" value="极好" />
          <el-option label="良好" value="良好" />
          <el-option label="一般" value="一般" />
          <el-option label="较差" value="较差" />
          <el-option label="很差" value="很差" />
        </el-select>
        <el-input v-model="createForm.notes" placeholder="备注" />
      </div>
      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <el-button type="primary" @click="submitCreate">提交</el-button>
        <el-button @click="resetCreateForm">重置</el-button>
      </div>
    </el-card>

    <!-- 睡眠记录列表 -->
    <el-card style="margin-top: 12px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>睡眠记录列表</span>
          <el-button type="primary" size="small" @click="loadRecords">刷新</el-button>
        </div>
      </template>

      <el-table :data="displayRecords" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column prop="duration" label="睡眠时长" width="120" />
        <el-table-column prop="quality" label="睡眠质量" width="120" />
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
import { sleepAPI } from '../api/modules/sleep.js';

const auth = useAuthStore();
const records = ref([]);
const loading = ref(false);

const filters = reactive({
  userId: '',
  minHours: '',
  maxHours: '',
  startDate: '',
  endDate: ''
});

const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

const displayRecords = computed(() => {
  return (records.value || []).map(r => {
    // 兼容不同字段命名
    const start = r.startTime || r.start_time;
    const end = r.endTime || r.end_time;
    const date = r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0]) : (start ? (typeof start === 'string' ? start.split(' ')[0] : new Date(start).toISOString().split('T')[0]) : '');
    // 计算时长
    let durationHours = 0;
    if (typeof r.durationMinutes === 'number') {
      durationHours = r.durationMinutes / 60;
    } else if (typeof r.sleep_hours === 'number') {
      durationHours = r.sleep_hours;
    } else if (start && end) {
      const startMs = new Date(start).getTime();
      const endMs = new Date(end).getTime();
      if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs) {
        durationHours = (endMs - startMs) / 3600000;
      }
    }

    return {
      id: r.id,
      userId: r.userId || r.user_id,
      date,
      startTime: start ? (typeof start === 'string' ? start : new Date(start).toLocaleString()) : '',
      endTime: end ? (typeof end === 'string' ? end : new Date(end).toLocaleString()) : '',
      durationHours,
      duration: (r.duration ?? r.durationMinutes ?? r.sleep_hours ?? null),
      quality: r.quality || '一般',
      deepSleepMinutes: r.deepSleepMinutes ?? r.deep_sleep_minutes ?? 0,
      lightSleepMinutes: r.lightSleepMinutes ?? r.light_sleep_minutes ?? 0,
      remSleepMinutes: r.remSleepMinutes ?? r.rem_sleep_minutes ?? 0,
      wakeTimes: r.wakeTimes ?? r.wake_times ?? 0,
      notes: r.notes || ''
    };
  });
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
    if (filters.minHours) params.minHours = Number(filters.minHours);
    if (filters.maxHours) params.maxHours = Number(filters.maxHours);

    const resp = await sleepAPI.getRecords(params);
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

    // 计算统计信息
    calculateStatistics();
  } catch (e) {
    ElMessage.error(e?.message || e?.response?.data?.message || '加载睡眠记录失败');
  } finally {
    loading.value = false;
  }
}

function calculateStatistics() {
  const sleepRecords = displayRecords.value.filter(record => typeof record.durationHours === 'number' && record.durationHours > 0);
  statistics.totalRecords = sleepRecords.length;
  statistics.totalHours = sleepRecords.reduce((sum, record) => sum + (record.durationHours || 0), 0);
  statistics.avgHours = statistics.totalRecords > 0 ? statistics.totalHours / statistics.totalRecords : 0;
  statistics.maxHours = sleepRecords.length > 0 ? Math.max(...sleepRecords.map(record => record.durationHours || 0)) : 0;

  // 重置质量分布
  Object.keys(statistics.qualityDistribution).forEach(key => {
    statistics.qualityDistribution[key] = 0;
  });

  // 统计质量分布
  sleepRecords.forEach(record => {
    const quality = record.quality || '一般';
    if (statistics.qualityDistribution.hasOwnProperty(quality)) {
      statistics.qualityDistribution[quality]++;
    }
  });
}

async function deleteRecord(record) {
  try {
    await ElMessageBox.confirm(`确定要删除睡眠记录 #${record.id} 吗？`, '警告', { type: 'warning' });
    const resp = await sleepAPI.deleteRecord(record.id);
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

const statistics = reactive({
  totalRecords: 0,
  avgHours: 0,
  maxHours: 0,
  totalHours: 0,
  qualityDistribution: {
    '极好': 0,
    '良好': 0,
    '一般': 0,
    '较差': 0,
    '很差': 0
  }
});

function getQualityColor(quality) {
  const colors = {
    '极好': '#67C23A',
    '良好': '#409EFF',
    '一般': '#E6A23C',
    '较差': '#F56C6C',
    '很差': '#909399'
  };
  return colors[quality] || '#909399';
}

const createForm = reactive({
  userId: '',
  startTime: '',
  endTime: '',
  quality: '一般',
  deepSleepMinutes: null,
  lightSleepMinutes: null,
  remSleepMinutes: null,
  wakeTimes: null,
  notes: ''
});

function resetCreateForm() {
  createForm.userId = '';
  createForm.startTime = '';
  createForm.endTime = '';
  createForm.quality = '一般';
  createForm.deepSleepMinutes = null;
  createForm.lightSleepMinutes = null;
  createForm.remSleepMinutes = null;
  createForm.wakeTimes = null;
  createForm.notes = '';
}

async function submitCreate() {
  try {
    if (!createForm.startTime || !createForm.endTime) {
      ElMessage.error('请填写开始时间与结束时间');
      return;
    }
    const startMs = new Date(createForm.startTime).getTime();
    const endMs = new Date(createForm.endTime).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      ElMessage.error('结束时间必须晚于开始时间');
      return;
    }

    const payload = {
      startTime: createForm.startTime,
      endTime: createForm.endTime,
      quality: createForm.quality,
      notes: createForm.notes
    };
    if (auth.isAdmin && createForm.userId) payload.userId = Number(createForm.userId);
    if (createForm.deepSleepMinutes != null) payload.deepSleepMinutes = Number(createForm.deepSleepMinutes);
    if (createForm.lightSleepMinutes != null) payload.lightSleepMinutes = Number(createForm.lightSleepMinutes);
    if (createForm.remSleepMinutes != null) payload.remSleepMinutes = Number(createForm.remSleepMinutes);
    if (createForm.wakeTimes != null) payload.wakeTimes = Number(createForm.wakeTimes);

    const resp = await sleepAPI.createRecord(payload);
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
  filters.minHours = '';
  filters.maxHours = '';
  filters.startDate = '';
  filters.endDate = '';
  pagination.current = 1;
  loadRecords();
}

onMounted(() => {
  loadRecords();
});
</script>