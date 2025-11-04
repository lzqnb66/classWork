<template>
  <div>
    <div style="font-size:14px;padding:8px 0;">周步数趋势</div>
    <div ref="chartEl" style="width:100%;height:260px;background:#fff;border-radius:8px;"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import * as echarts from 'echarts';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const chartEl = ref();

async function load() {
  try {
    const { data } = await auth.api().get('/records/analysis/weekly-steps');
    const dates = data.map(d => d.date);
    const values = data.map(d => d.total_steps);
    const chart = echarts.init(chartEl.value);
    chart.setOption({
      tooltip: {},
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [{ data: values, type: 'line', smooth: true }]
    });
  } catch (e) {
    // no-op
  }
}

onMounted(load);
</script>