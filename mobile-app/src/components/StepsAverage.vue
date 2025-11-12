<template>
  <div>
    <van-cell-group inset>
      <van-field v-model="startDate" label="开始日期" placeholder="YYYY-MM-DD" />
      <van-field v-model="endDate" label="结束日期" placeholder="YYYY-MM-DD" />
      <van-field v-model.number="threshold" type="number" label="达标阈值(步)" placeholder="默认 10000" />
    </van-cell-group>
    <div style="margin:12px 0; display:flex; gap:8px;">
      <van-button type="primary" size="small" @click="load">计算日均步数</van-button>
      <van-button type="default" size="small" @click="setLast7Days">最近7天</van-button>
    </div>

    <div v-if="loaded" style="margin-top:8px;">
      <van-cell-group inset>
        <van-cell title="平均步数" :value="result.average_steps" />
        <van-cell title="达标阈值" :value="result.threshold" />
        <van-cell title="是否达标" :value="result.meet_goal ? '已达标' : '未达标'" />
      </van-cell-group>
      <div ref="chartRef" style="height:240px;margin-top:8px;background:#fff;border-radius:8px;" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import { useAuthStore } from '../store/auth';
import { showFailToast, showSuccessToast } from 'vant';

const auth = useAuthStore();
const startDate = ref('');
const endDate = ref('');
const threshold = ref(10000);
const result = ref({ average_steps: 0, threshold: 10000, meet_goal: false });
const loaded = ref(false);
const chartRef = ref(null);
let chart;

function fmt(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || ''); }

function setLast7Days() {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 6);
  const iso = (d) => d.toISOString().slice(0,10);
  startDate.value = iso(start);
  endDate.value = iso(today);
}

async function load() {
  if (!fmt(startDate.value) || !fmt(endDate.value)) return showFailToast('请输入有效日期 YYYY-MM-DD');
  try {
    const { data } = await auth.api().get('/records/analysis/steps-average', {
      params: { startDate: startDate.value, endDate: endDate.value, threshold: threshold.value }
    });
    result.value = data;
    loaded.value = true;
    renderChart();
  } catch (e) {
    showFailToast(e?.response?.data?.message || '计算失败');
  }
}

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);
  const avg = Number(result.value.average_steps || 0);
  const th = Number(result.value.threshold || 0);
  const meet = !!result.value.meet_goal;
  chart.setOption({
    backgroundColor: '#fff',
    grid: { left: 20, right: 20, top: 20, bottom: 20 },
    xAxis: { type: 'category', data: ['平均', '目标'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: [avg, th],
      itemStyle: {
        color: (params) => params.dataIndex === 0 ? (meet ? '#4fc08d' : '#ff9f43') : '#91cc75'
      },
      label: { show: true, position: 'top' }
    }],
    tooltip: {}
  });
}

onMounted(() => {
  setLast7Days();
});
</script>

<style scoped>
</style>