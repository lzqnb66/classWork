<template>
  <div style="padding:16px;">
    <el-page-header content="健康管理后台" />

    <!-- 数据统计卡片 -->
    <el-row :gutter="16" style="margin-top:12px;">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display:flex;align-items:center;">
            <el-icon size="32" color="#409EFF"><User /></el-icon>
            <div style="margin-left:12px;">
              <div style="font-size:14px;color:#909399;">总用户数</div>
              <div style="font-size:24px;font-weight:bold;">{{ stats.totalUsers }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display:flex;align-items:center;">
            <el-icon size="32" color="#67C23A"><TrendCharts /></el-icon>
            <div style="margin-left:12px;">
              <div style="font-size:14px;color:#909399;">总记录数</div>
              <div style="font-size:24px;font-weight:bold;">{{ stats.totalRecords }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display:flex;align-items:center;">
            <el-icon size="32" color="#E6A23C"><Calendar /></el-icon>
            <div style="margin-left:12px;">
              <div style="font-size:14px;color:#909399;">今日新增</div>
              <div style="font-size:24px;font-weight:bold;">{{ stats.todayRecords }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display:flex;align-items:center;">
            <el-icon size="32" color="#F56C6C"><DataAnalysis /></el-icon>
            <div style="margin-left:12px;">
              <div style="font-size:14px;color:#909399;">活跃用户</div>
              <div style="font-size:24px;font-weight:bold;">{{ stats.activeUsers }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据筛选 -->
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

    <!-- 趋势图表 -->
    <el-row :gutter="16" style="margin-top:12px;">
      <el-col :span="12">
        <el-card>
          <template #header>步数趋势</template>
          <div ref="stepsChart" style="height:300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>睡眠时长趋势</template>
          <div ref="sleepChart" style="height:300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 记录列表 -->
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

    <!-- 用户列表 -->
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
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { User, TrendCharts, Calendar, DataAnalysis } from '@element-plus/icons-vue';
import { useAuthStore } from '../store/store.js';
import { usersAPI } from '../api/modules/users';
import { recordsAPI } from '../api/modules/records';
import { dashboardAPI } from '../api/modules/dashboard';
import * as echarts from 'echarts';

const auth = useAuthStore();
const filters = ref({ userId: '', type: '', startDate: '', endDate: '' });
const records = ref([]);
const users = ref([]);
const stats = ref({
  totalUsers: 0,
  totalRecords: 0,
  todayRecords: 0,
  activeUsers: 0
});

const stepsChart = ref(null);
const sleepChart = ref(null);
let stepsChartInstance = null;
let sleepChartInstance = null;

async function loadStats() {
  try {
    // 获取统计数据
    const [usersRes, recordsRes] = await Promise.all([
      usersAPI.getUsers(),
      recordsAPI.getRecords({ limit: 1000 })
    ]);
    
    const allUsers = usersRes.data;
    const allRecords = recordsRes.data;
    
    // 计算今日日期
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = allRecords.filter(record => record.date === today);
    
    // 计算活跃用户（最近7天有记录的用户）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = new Set(
      allRecords
        .filter(record => new Date(record.date) >= sevenDaysAgo)
        .map(record => record.user_id)
    ).size;
    
    stats.value = {
      totalUsers: allUsers.length,
      totalRecords: allRecords.length,
      todayRecords: todayRecords.length,
      activeUsers: activeUsers
    };
    
    // 更新图表数据
    updateCharts(allRecords);
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '加载统计失败');
  }
}

async function loadRecords() {
  try {
    const response = await recordsAPI.getRecords({
      userId: filters.value.userId || undefined,
      type: filters.value.type || undefined,
      startDate: formatDate(filters.value.startDate),
      endDate: formatDate(filters.value.endDate),
    });
    records.value = response.data;
    
    // 重新加载统计数据
    await loadStats();
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '查询失败');
  }
}

async function loadUsers() {
  try {
    const response = await usersAPI.getUsers();
    users.value = response.data;
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
    await recordsAPI.deleteRecord(row.id);
    ElMessage.success('删除成功');
    await loadRecords();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.response?.data?.message || '删除失败');
  }
}

function updateCharts(records) {
  // 处理步数数据
  const stepsData = records
    .filter(record => record.type === 'steps' && record.steps)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30); // 最近30天
  
  const sleepData = records
    .filter(record => record.type === 'sleep' && record.sleep_hours)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30); // 最近30天
  
  // 更新步数图表
  if (stepsChartInstance && stepsData.length > 0) {
    stepsChartInstance.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>{a}: {c} 步'
      },
      xAxis: {
        type: 'category',
        data: stepsData.map(item => item.date)
      },
      yAxis: {
        type: 'value',
        name: '步数'
      },
      series: [{
        name: '步数',
        type: 'line',
        data: stepsData.map(item => item.steps),
        smooth: true,
        lineStyle: {
          color: '#67C23A'
        },
        itemStyle: {
          color: '#67C23A'
        }
      }]
    });
  }
  
  // 更新睡眠图表
  if (sleepChartInstance && sleepData.length > 0) {
    sleepChartInstance.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>{a}: {c} 小时'
      },
      xAxis: {
        type: 'category',
        data: sleepData.map(item => item.date)
      },
      yAxis: {
        type: 'value',
        name: '小时'
      },
      series: [{
        name: '睡眠时长',
        type: 'line',
        data: sleepData.map(item => item.sleep_hours),
        smooth: true,
        lineStyle: {
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        }
      }]
    });
  }
}

function initCharts() {
  nextTick(() => {
    if (stepsChart.value) {
      stepsChartInstance = echarts.init(stepsChart.value);
      stepsChartInstance.setOption({
        title: { text: '步数趋势', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value', name: '步数' },
        series: [{ name: '步数', type: 'line', data: [] }]
      });
    }
    
    if (sleepChart.value) {
      sleepChartInstance = echarts.init(sleepChart.value);
      sleepChartInstance.setOption({
        title: { text: '睡眠时长趋势', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value', name: '小时' },
        series: [{ name: '睡眠时长', type: 'line', data: [] }]
      });
    }
  });
}

// 初始化加载
onMounted(() => {
  initCharts();
  loadUsers();
  loadRecords();
});
</script>