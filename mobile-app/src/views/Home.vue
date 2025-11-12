<template>
  <div style="padding: 12px">
    <!-- 顶部轮播图展示区 -->
    <van-swipe
      :autoplay="4000"
      indicator-color="white"
      style="height: 140px; border-radius: 12px; overflow: hidden"
    >
      <van-swipe-item>
        <div class="banner banner-1">
          <div class="banner-text">坚持记录，科学管理健康</div>
        </div>
      </van-swipe-item>
      <van-swipe-item>
        <div class="banner banner-2">
          <div class="banner-text">每天进步一点点 💪</div>
        </div>
      </van-swipe-item>
      <van-swipe-item>
        <div class="banner banner-3">
          <div class="banner-text">合理饮食，规律睡眠</div>
        </div>
      </van-swipe-item>
    </van-swipe>

    <div style="height: 12px" />

    <!-- 快捷功能入口 - 大卡片样式 -->
    <div class="quick-access-cards">
      <div class="quick-card diet-card" @click="$router.push('/diet')">
        <div class="card-icon">
          <van-icon name="fire-o" size="32" />
        </div>
        <div class="card-content">
          <div class="card-title">饮食记录</div>
          <div class="card-desc">记录每日饮食摄入</div>
        </div>
        <van-icon name="arrow" class="card-arrow" />
      </div>

      <div class="quick-card steps-card" @click="$router.push('/steps')">
        <div class="card-icon">
          <van-icon name="friends-o" size="32" />
        </div>
        <div class="card-content">
          <div class="card-title">步数记录</div>
          <div class="card-desc">追踪每日运动步数</div>
        </div>
        <van-icon name="arrow" class="card-arrow" />
      </div>

      <div class="quick-card sleep-card" @click="$router.push('/sleep')">
        <div class="card-icon">
          <van-icon name="clock-o" size="32" />
        </div>
        <div class="card-content">
          <div class="card-title">睡眠记录</div>
          <div class="card-desc">记录睡眠时长质量</div>
        </div>
        <van-icon name="arrow" class="card-arrow" />
      </div>

      <div class="quick-card query-card" @click="$router.push('/query')">
        <div class="card-icon">
          <van-icon name="search" size="32" />
        </div>
        <div class="card-content">
          <div class="card-title">数据查询</div>
          <div class="card-desc">查看历史记录统计</div>
        </div>
        <van-icon name="arrow" class="card-arrow" />
      </div>
    </div>

    <!-- 内容卡片列表 -->
    <div class="card-list">
      <van-card
        v-for="r in records"
        :key="r.id"
        :title="cardTitle(r)"
        :desc="cardDesc(r)"
        :tag="cardTag(r)"
      >
        <template #footer>
          <div style="display: flex; gap: 8px">
            <van-button size="small" type="primary" @click="openEdit(r)"
              >编辑</van-button
            >
            <van-button size="small" type="danger" @click="remove(r)"
              >删除</van-button
            >
          </div>
        </template>
      </van-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { showFailToast, showSuccessToast, showConfirmDialog } from "vant";
import { useAuthStore } from "../store/auth";

const auth = useAuthStore();
const activeTab = ref(0);
const activeMenu = ref("home");

const form = ref({
  date: "",
  steps: null,
  sleep_hours: null,
  food_name: "",
  calories: null,
});
const filter = ref({ startDate: "", endDate: "" });
const records = ref([]);

const showEdit = ref(false);
const selectedRecord = ref(null);
const editForm = ref({
  id: null,
  type: "",
  date: "",
  steps: null,
  sleep_hours: null,
  food_name: "",
  calories: null,
});

function checkDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d || "");
}

// 快捷入口
function quickAdd(type) {
  if (!checkDate(form.value.date))
    return showFailToast("请输入日期 YYYY-MM-DD");
  if (type === "steps") return addSteps();
  if (type === "sleep") return addSleep();
  if (type === "diet") return addDiet();
}
function quickQuery() {
  return loadRecords();
}

async function addSteps() {
  if (!checkDate(form.value.date))
    return showFailToast("请输入日期 YYYY-MM-DD");
  try {
    await auth
      .api()
      .post("/records", {
        type: "steps",
        date: form.value.date,
        steps: form.value.steps,
      });
    showSuccessToast("已新增步数");
    await loadRecords();
  } catch (e) {
    showFailToast(e?.response?.data?.message || "新增失败");
  }
}

async function addSleep() {
  if (!checkDate(form.value.date))
    return showFailToast("请输入日期 YYYY-MM-DD");
  try {
    await auth
      .api()
      .post("/records", {
        type: "sleep",
        date: form.value.date,
        sleep_hours: form.value.sleep_hours,
      });
    showSuccessToast("已新增睡眠");
    await loadRecords();
  } catch (e) {
    showFailToast(e?.response?.data?.message || "新增失败");
  }
}

async function addDiet() {
  if (!checkDate(form.value.date))
    return showFailToast("请输入日期 YYYY-MM-DD");
  try {
    await auth
      .api()
      .post("/records", {
        type: "diet",
        date: form.value.date,
        food_name: form.value.food_name,
        calories: form.value.calories,
      });
    showSuccessToast("已新增饮食");
    await loadRecords();
  } catch (e) {
    showFailToast(e?.response?.data?.message || "新增失败");
  }
}

async function loadRecords() {
  try {
    const { data } = await auth
      .api()
      .get("/records", {
        params: {
          startDate: filter.value.startDate,
          endDate: filter.value.endDate,
        },
      });
    records.value = data;
  } catch (e) {
    showFailToast(e?.response?.data?.message || "查询失败");
  }
}

function cardTitle(r) {
  return r.type === "steps"
    ? `步数：${r.steps ?? 0}`
    : r.type === "sleep"
    ? `睡眠：${r.sleep_hours ?? 0} 小时`
    : r.type === "diet"
    ? `饮食：${r.food_name ?? ""}`
    : r.type;
}
function cardDesc(r) {
  return (
    `日期：${r.date}` +
    (r.type === "diet" ? ` ｜ 热量：${r.calories ?? 0} 卡` : "")
  );
}
function cardTag(r) {
  return r.type === "steps"
    ? "步数"
    : r.type === "sleep"
    ? "睡眠"
    : r.type === "diet"
    ? "饮食"
    : "";
}

async function remove(r) {
  try {
    await auth.api().delete(`/records/${r.id}`);
    showSuccessToast("已删除");
    await loadRecords();
  } catch (e) {
    showFailToast(e?.response?.data?.message || "删除失败");
  }
}

function openEdit(r) {
  selectedRecord.value = r;
  editForm.value = {
    id: r.id,
    type: r.type,
    date: r.date,
    steps: r.steps ?? null,
    sleep_hours: r.sleep_hours ?? null,
    food_name: r.food_name ?? "",
    calories: r.calories ?? null,
  };
  showEdit.value = true;
}

async function saveEdit() {
  if (!checkDate(editForm.value.date))
    return showFailToast("请输入日期 YYYY-MM-DD");
  const payload = { type: editForm.value.type, date: editForm.value.date };
  if (editForm.value.type === "steps")
    payload.steps = editForm.value.steps ?? 0;
  if (editForm.value.type === "sleep")
    payload.sleep_hours = editForm.value.sleep_hours ?? 0;
  if (editForm.value.type === "diet") {
    payload.food_name = editForm.value.food_name || "";
    payload.calories = editForm.value.calories ?? 0;
  }
  try {
    await auth.api().put(`/records/${editForm.value.id}`, payload);
    showSuccessToast("已保存");
    showEdit.value = false;
    await loadRecords();
  } catch (e) {
    showFailToast(e?.response?.data?.message || "保存失败");
  }
}

async function handleLogout() {
  try {
    await showConfirmDialog({
      title: "确认退出",
      message: "您确定要退出登录吗？",
      confirmButtonText: "确认退出",
      cancelButtonText: "取消",
    });

    // 调用退出登录
    await auth.logout();

    // 跳转到登录页
    $router.replace("/login");
    showSuccessToast("已安全退出");
  } catch (error) {
    // 用户取消了操作
    if (error !== "cancel") {
      showFailToast("退出失败");
    }
  }
}
</script>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #fff;
}
.banner-1 {
  background: linear-gradient(135deg, #5c7aea, #70a1ff);
}
.banner-2 {
  background: linear-gradient(135deg, #ff7a59, #ffb199);
}
.banner-3 {
  background: linear-gradient(135deg, #34c759, #78e08f);
}
.banner-text {
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* 快捷功能大卡片样式 */
.quick-access-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.quick-card {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #f0f0f0;
}

.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.quick-card:active {
  transform: translateY(0);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.diet-card .card-icon {
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
}
.steps-card .card-icon {
  background: linear-gradient(135deg, #4ecdc4, #88d3ce);
}
.sleep-card .card-icon {
  background: linear-gradient(135deg, #45b7d1, #96d3e8);
}
.query-card .card-icon {
  background: linear-gradient(135deg, #fd7e14, #ffa94d);
}

.card-icon .van-icon {
  color: white;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
  line-height: 1.2;
}

.card-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.card-arrow {
  color: #ccc;
  font-size: 18px;
  margin-left: 8px;
}

.card-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
@media (min-width: 480px) {
  .card-list {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
