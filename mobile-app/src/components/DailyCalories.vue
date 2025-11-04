<template>
  <div>
    <div style="font-size:14px;padding:8px 0;">日饮食热量分布</div>
    <van-field v-model="date" label="日期" placeholder="YYYY-MM-DD" />
    <div style="height:8px"></div>
    <div ref="chartEl" style="width:100%;height:260px;background:#fff;border-radius:8px;"></div>
    <div style="margin-top:8px;text-align:right;">
      <van-button type="primary" size="small" @click="load">刷新</van-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import * as echarts from 'echarts';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const chartEl = ref();
const date = ref(new Date().toISOString().slice(0,10));

async function load() {
  try {
    const { data } = await auth.api().get('/records/analysis/daily-calories', { params: { date: date.value } });
    const chart = echarts.init(chartEl.value);
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [
        {
          name: '热量',
          type: 'pie',
          radius: '60%',
          data: data.map(i => ({ name: i.food_name || '未知', value: Number(i.calories || 0) }))
        }
      ]
    });
  } catch (e) {
    // no-op
  }
}

onMounted(load);
</script>