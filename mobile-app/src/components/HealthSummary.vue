<template>
  <div>
    <div style="font-size:14px;padding:8px 0;display:flex;justify-content:space-between;align-items:center;">
      <span>简易健康报告</span>
      <van-button size="small" type="primary" @click="setLast7Days">近7天</van-button>
    </div>
    <van-cell-group inset>
      <van-field v-model="startDate" label="开始日期" placeholder="YYYY-MM-DD" />
      <van-field v-model="endDate" label="结束日期" placeholder="YYYY-MM-DD" />
      <van-field v-model.number="threshold" type="number" label="步数达标阈值" placeholder="例如 8000" />
    </van-cell-group>
    <div style="margin-top:8px;text-align:right;">
      <van-button type="primary" size="small" @click="load">生成报告</van-button>
    </div>

    <div v-if="summary" style="margin-top:12px;background:#fff;border-radius:8px;padding:12px;">
      <div style="display:flex;gap:12px;justify-content:space-between;">
        <div style="flex:1;">
          <div style="font-weight:600;">步数</div>
          <div style="font-size:12px;color:#666;">总步数：{{ summary.steps.total }}</div>
          <div style="font-size:12px;color:#666;">日均步数：{{ Math.round(summary.steps.average) }}</div>
          <div style="font-size:12px;color:#666;">达标阈值：{{ summary.steps.threshold }}</div>
          <van-tag :type="summary.steps.meet_goal ? 'success' : 'danger'">{{ summary.steps.meet_goal ? '已达标' : '未达标' }}</van-tag>
        </div>
        <div style="flex:1;">
          <div style="font-weight:600;">睡眠</div>
          <div style="font-size:12px;color:#666;">总时长：{{ Number(summary.sleep.total_hours.toFixed(1)) }} 小时</div>
          <div style="font-size:12px;color:#666;">平均时长：{{ Number(summary.sleep.average_hours.toFixed(1)) }} 小时/天</div>
        </div>
        <div style="flex:1;">
          <div style="font-weight:600;">饮食</div>
          <div style="font-size:12px;color:#666;">总热量：{{ summary.diet.total_calories }} 卡</div>
        </div>
      </div>
      <div style="height: 12px" />
      <div>
        <div style="font-weight:600;font-size:13px;margin-bottom:6px;">高热量Top5</div>
        <van-cell-group inset v-if="foods.length">
          <van-cell
            v-for="f in foods"
            :key="(f.food_name || '未知') + '_' + (f.total_calories || 0)"
            :title="f.food_name || '未知食物'"
            :value="(f.total_calories || 0) + ' 卡'"
          />
        </van-cell-group>
        <div v-else style="font-size:12px;color:#999;">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const startDate = ref(new Date(Date.now() - 6*24*60*60*1000).toISOString().slice(0,10));
const endDate = ref(new Date().toISOString().slice(0,10));
const threshold = ref(10000);
const summary = ref(null);
const foods = ref([]);

function setLast7Days() {
  startDate.value = new Date(Date.now() - 6*24*60*60*1000).toISOString().slice(0,10);
  endDate.value = new Date().toISOString().slice(0,10);
}

async function load() {
  try {
    const { data } = await auth.api().get('/records/analysis/summary', {
      params: { startDate: startDate.value, endDate: endDate.value, threshold: threshold.value }
    });
    summary.value = data;
    foods.value = (data?.diet?.top_foods || []).map(f => ({ food_name: f.food_name, total_calories: Number(f.total_calories || 0) }));
  } catch (e) {
    // ignore
  }
}
</script>