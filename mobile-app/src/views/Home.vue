<template>
  <div>
    <van-nav-bar title="健康数据记录" />

    <van-tabs v-model:active="activeTab">
      <van-tab title="记录">
        <div style="padding: 12px;">
          <van-cell-group inset>
            <van-field v-model="form.date" label="日期" placeholder="YYYY-MM-DD" />
            <van-field v-model.number="form.steps" type="number" label="步数" placeholder="例如 8000" />
            <van-field v-model.number="form.sleep_hours" type="number" label="睡眠时长(小时)" placeholder="例如 7.5" />
            <van-field v-model="form.food_name" label="食物名" placeholder="例如 鸡胸肉" />
            <van-field v-model.number="form.calories" type="number" label="热量(卡)" placeholder="例如 320" />
          </van-cell-group>
          <div style="margin: 12px 0; display:flex; gap:8px;">
            <van-button type="primary" @click="addSteps" size="small">新增步数</van-button>
            <van-button type="primary" @click="addSleep" size="small">新增睡眠</van-button>
            <van-button type="primary" @click="addDiet" size="small">新增饮食</van-button>
          </div>

          <van-cell-group inset>
            <van-field v-model="filter.startDate" label="开始日期" placeholder="YYYY-MM-DD" />
            <van-field v-model="filter.endDate" label="结束日期" placeholder="YYYY-MM-DD" />
          </van-cell-group>
          <div style="margin: 12px 0;">
            <van-button type="default" block @click="loadRecords">按日期范围查询</van-button>
          </div>

          <van-list>
            <van-cell v-for="r in records" :key="r.id" :title="formatTitle(r)" :label="r.date">
              <template #right-icon>
                <van-button size="small" type="danger" @click="remove(r)">删除</van-button>
              </template>
            </van-cell>
          </van-list>
        </div>
      </van-tab>

      <van-tab title="分析">
        <div style="padding: 12px;">
          <StepsTrend />
          <div style="height: 12px" />
          <DailyCalories />
        </div>
      </van-tab>
    </van-tabs>

    <van-tabbar fixed>
      <van-tabbar-item @click="logout">退出登录</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Toast } from 'vant';
import { useAuthStore } from '../store/auth';
import StepsTrend from '../components/StepsTrend.vue';
import DailyCalories from '../components/DailyCalories.vue';

const auth = useAuthStore();
const activeTab = ref(0);

const form = ref({ date: '', steps: null, sleep_hours: null, food_name: '', calories: null });
const filter = ref({ startDate: '', endDate: '' });
const records = ref([]);

function checkDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || ''); }

async function addSteps() {
  if (!checkDate(form.value.date)) return Toast.fail('请输入日期 YYYY-MM-DD');
  try {
    await auth.api().post('/records', { type: 'steps', date: form.value.date, steps: form.value.steps });
    Toast.success('已新增步数');
    await loadRecords();
  } catch (e) { Toast.fail(e?.response?.data?.message || '新增失败'); }
}

async function addSleep() {
  if (!checkDate(form.value.date)) return Toast.fail('请输入日期 YYYY-MM-DD');
  try {
    await auth.api().post('/records', { type: 'sleep', date: form.value.date, sleep_hours: form.value.sleep_hours });
    Toast.success('已新增睡眠');
    await loadRecords();
  } catch (e) { Toast.fail(e?.response?.data?.message || '新增失败'); }
}

async function addDiet() {
  if (!checkDate(form.value.date)) return Toast.fail('请输入日期 YYYY-MM-DD');
  try {
    await auth.api().post('/records', { type: 'diet', date: form.value.date, food_name: form.value.food_name, calories: form.value.calories });
    Toast.success('已新增饮食');
    await loadRecords();
  } catch (e) { Toast.fail(e?.response?.data?.message || '新增失败'); }
}

async function loadRecords() {
  try {
    const { data } = await auth.api().get('/records', { params: { startDate: filter.value.startDate, endDate: filter.value.endDate } });
    records.value = data;
  } catch (e) { Toast.fail(e?.response?.data?.message || '查询失败'); }
}

function formatTitle(r) {
  if (r.type === 'steps') return `步数：${r.steps ?? 0}`;
  if (r.type === 'sleep') return `睡眠：${r.sleep_hours ?? 0} 小时`;
  if (r.type === 'diet') return `饮食：${r.food_name ?? ''} (${r.calories ?? 0} 卡)`;
  return r.type;
}

async function remove(r) {
  try {
    await auth.api().delete(`/records/${r.id}`);
    Toast.success('已删除');
    await loadRecords();
  } catch (e) { Toast.fail(e?.response?.data?.message || '删除失败'); }
}

function logout() { auth.logout(); location.href = '/login'; }
</script>