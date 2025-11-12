<template>
  <div class="sleep-module">
    <van-nav-bar
      title="睡眠记录"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="module-content">
      <div class="sleep-overview">
        <van-row gutter="12">
          <van-col span="8">
            <van-cell center :border="false" class="stat-card">
              <template #title>
                <div class="stat-value">{{ sleepStats.totalHours }}</div>
                <div class="stat-label">总时长</div>
              </template>
            </van-cell>
          </van-col>
          <van-col span="8">
            <van-cell center :border="false" class="stat-card">
              <template #title>
                <div class="stat-value">{{ sleepStats.avgQuality }}</div>
                <div class="stat-label">平均质量</div>
              </template>
            </van-cell>
          </van-col>
          <van-col span="8">
            <van-cell center :border="false" class="stat-card">
              <template #title>
                <div class="stat-value">{{ sleepStats.consistency }}%</div>
                <div class="stat-label">规律性</div>
              </template>
            </van-cell>
          </van-col>
        </van-row>
      </div>

      <div
        class="sleep-cycle-chart"
        style="
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        "
      >
        <div class="chart-title">睡眠周期分析</div>
        <div ref="sleepChartRef" style="height: 180px"></div>
      </div>

      <van-cell-group title="记录睡眠" style="margin-bottom: 16px">
        <van-field
          v-model="sleepForm.startTime"
          is-link
          readonly
          label="入睡时间"
          placeholder="选择入睡时间"
          @click="showStartTimePicker = true"
        />
        <van-field
          v-model="sleepForm.endTime"
          is-link
          readonly
          label="起床时间"
          placeholder="选择起床时间"
          @click="showEndTimePicker = true"
        />
        <van-field
          v-model="sleepForm.quality"
          is-link
          readonly
          label="睡眠质量"
          placeholder="选择质量评级"
          @click="showQualityPicker = true"
        />
        <van-field
          v-model="sleepForm.notes"
          label="备注"
          type="textarea"
          placeholder="记录睡眠情况（如梦境、中途醒来等）"
          rows="2"
          autosize
        />
      </van-cell-group>

      <div style="padding: 0 16px; margin-bottom: 16px">
        <van-button
          type="primary"
          size="large"
          @click="saveSleepRecord"
          :loading="saving"
          >保存记录</van-button
        >
      </div>

      <div
        class="sleep-advice"
        style="
          background: #e8f4fd;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        "
      >
        <div style="font-weight: bold; margin-bottom: 8px">睡眠建议</div>
        <div style="font-size: 14px; color: #666">{{ sleepAdvice }}</div>
      </div>

      <van-cell-group title="最近记录">
        <van-swipe-cell
          v-for="record in recentRecords"
          :key="record.id"
          :before-close="beforeClose"
        >
          <van-cell
            :title="formatDuration(record.duration)"
            :value="record.date"
            :label="`${record.startTime} - ${record.endTime} | ${record.quality}`"
          />
          <template #right>
            <van-button
              square
              type="danger"
              text="删除"
              @click="deleteRecord(record.id)"
              style="height: 100%"
            />
            <van-button
              square
              type="primary"
              text="编辑"
              @click="editRecord(record)"
              style="height: 100%"
            />
          </template>
        </van-swipe-cell>
      </van-cell-group>

      <van-empty v-if="recentRecords.length === 0" description="暂无睡眠记录" />
    </div>

    <van-popup v-if="showStartTimePicker" v-model:show="showStartTimePicker" round position="bottom">
      <van-time-picker
        v-model="startTimeValue"
        @confirm="onStartTimeConfirm"
        @cancel="showStartTimePicker = false"
      />
    </van-popup>

    <van-popup v-if="showEndTimePicker" v-model:show="showEndTimePicker" round position="bottom">
      <van-time-picker
        v-model="endTimeValue"
        @confirm="onEndTimeConfirm"
        @cancel="showEndTimePicker = false"
      />
    </van-popup>

    <van-popup v-if="showQualityPicker" v-model:show="showQualityPicker" round position="bottom">
      <van-picker
        :columns="qualityOptions"
        @confirm="onQualityConfirm"
        @cancel="showQualityPicker = false"
        value-key="value"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import {
  showSuccessToast,
  showFailToast,
  showLoadingToast,
  closeToast,
} from "vant";
import * as echarts from "echarts";
import {
  getSleepRecords,
  createSleepRecord,
  deleteSleepRecord,
  getSleepSummary,
  getSleepTrend,
} from "@/api/sleep.js";

const sleepForm = reactive({
  startTime: "",
  endTime: "",
  quality: "",
  notes: "",
});

const showStartTimePicker = ref(false);
const showEndTimePicker = ref(false);
const showQualityPicker = ref(false);
const saving = ref(false);
const sleepChartRef = ref(null);
let sleepChartInstance = null;

const startTimeValue = ref(["22", "00"]);
const endTimeValue = ref(["06", "30"]);
const qualityOptions = [
  { text: "极好", value: "极好" },
  { text: "良好", value: "良好" },
  { text: "一般", value: "一般" },
  { text: "较差", value: "较差" },
  { text: "很差", value: "很差" },
];

const recentRecords = ref([]);
const loading = ref(false);

const sleepStats = computed(() => {
  if (recentRecords.value.length === 0) {
    return {
      totalHours: "0.0",
      avgQuality: "一般",
      consistency: 0,
    };
  }

  const totalHours = recentRecords.value.reduce(
    (sum, record) => sum + parseFloat(record.duration || 0),
    0
  );
  const avgHours = (totalHours / recentRecords.value.length).toFixed(1);

  const qualityScores = {
    极好: 5,
    良好: 4,
    一般: 3,
    较差: 2,
    很差: 1,
  };

  const avgQualityScore =
    recentRecords.value.reduce(
      (sum, record) => sum + qualityScores[record.quality],
      0
    ) / recentRecords.value.length;

  const avgQuality =
    avgQualityScore >= 4.5
      ? "极好"
      : avgQualityScore >= 3.5
      ? "良好"
      : avgQualityScore >= 2.5
      ? "一般"
      : avgQualityScore >= 1.5
      ? "较差"
      : "很差";

  // 计算睡眠规律性（基于入睡时间的标准差）
  const bedTimes = recentRecords.value.map((record) => {
    const [hours, minutes] = record.startTime.split(":").map(Number);
    return hours * 60 + minutes;
  });

  const avgBedTime =
    bedTimes.reduce((sum, time) => sum + time, 0) / bedTimes.length;
  const bedTimeVariance = Math.sqrt(
    bedTimes.reduce((sum, time) => sum + Math.pow(time - avgBedTime, 2), 0) /
      bedTimes.length
  );

  // 规律性评分：标准差越小，规律性越高
  const consistency =
    bedTimeVariance < 60
      ? 90
      : bedTimeVariance < 120
      ? 70
      : bedTimeVariance < 180
      ? 50
      : 30;

  return {
    totalHours: totalHours.toFixed(1),
    avgQuality: avgQuality,
    consistency: consistency,
  };
});

const sleepAdvice = computed(() => {
  const avgHours = parseFloat(sleepStats.value.totalHours);
  const quality = sleepStats.value.avgQuality;

  if (avgHours < 6) {
    return "睡眠时间不足，建议增加睡眠时长至7-9小时，保持规律作息。";
  } else if (avgHours > 9) {
    return "睡眠时间偏长，建议保持7-9小时的健康睡眠时长。";
  } else if (quality === "较差" || quality === "很差") {
    return "睡眠质量有待提升，建议睡前避免使用电子设备，保持安静舒适的睡眠环境。";
  } else if (quality === "一般") {
    return "睡眠质量尚可，建议进一步优化睡眠习惯，如固定作息时间。";
  } else {
    return "睡眠状况良好！继续保持规律的作息和健康的睡眠习惯。";
  }
});

const saveSleepRecord = async () => {
  if (!sleepForm.startTime || !sleepForm.endTime || !sleepForm.quality) {
    showFailToast("请填写完整的睡眠信息");
    return;
  }

  saving.value = true;

  try {
    const response = await createSleepRecord({
      startTime: sleepForm.startTime,
      endTime: sleepForm.endTime,
      quality: sleepForm.quality,
      notes: sleepForm.notes,
      date: new Date().toISOString().split("T")[0],
    });

    if (response.data.success) {
      recentRecords.value.unshift(response.data.data);
      resetForm();
      showSuccessToast("睡眠记录保存成功");

      nextTick(() => {
        renderSleepChart();
      });
    } else {
      showFailToast(response.data.message || "保存失败");
    }
  } catch (error) {
    showFailToast(
      "保存失败：" + (error.response?.data?.message || error.message)
    );
  } finally {
    saving.value = false;
  }
};

const resetForm = () => {
  sleepForm.startTime = "";
  sleepForm.endTime = "";
  sleepForm.quality = "";
  sleepForm.notes = "";
};

const formatDuration = (hours) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}小时${minutes}分钟`;
};

const deleteRecord = async (id) => {
  try {
    const response = await deleteSleepRecord(id);
    if (response.data.success) {
      recentRecords.value = recentRecords.value.filter(
        (record) => record.id !== id
      );
      showSuccessToast("记录已删除");
      nextTick(() => {
        renderSleepChart();
      });
    } else {
      showFailToast(response.data.message || "删除失败");
    }
  } catch (error) {
    showFailToast(
      "删除失败：" + (error.response?.data?.message || error.message)
    );
  }
};

const editRecord = (record) => {
  sleepForm.startTime = record.startTime;
  sleepForm.endTime = record.endTime;
  sleepForm.quality = record.quality;
  sleepForm.notes = record.notes;
  showSuccessToast("已加载记录到表单");
};

const beforeClose = ({ position, instance }) => {
  switch (position) {
    case "left":
    case "cell":
    case "outside":
      instance.close();
      break;
    case "right":
      instance.close();
      break;
  }
};

const onStartTimeConfirm = (value) => {
  console.log("Start time picker value:", value);
  // Vant TimePicker 返回的是选中的值对象，需要提取时间值
  let hours, minutes;

  if (typeof value === "object" && value !== null) {
    // 对象格式 {selectedValues: [hour, minute, second], ...}
    if (value.selectedValues && Array.isArray(value.selectedValues)) {
      hours = String(value.selectedValues[0] || "00").padStart(2, "0");
      minutes = String(value.selectedValues[1] || "00").padStart(2, "0");
    } else if (value.hours !== undefined && value.minutes !== undefined) {
      // 对象格式 {hours, minutes}
      hours = String(value.hours || "00").padStart(2, "0");
      minutes = String(value.minutes || "00").padStart(2, "0");
    }
  } else if (Array.isArray(value)) {
    // 数组格式 [hour, minute, second]
    hours = String(value[0] || "00").padStart(2, "0");
    minutes = String(value[1] || "00").padStart(2, "0");
  }

  if (hours && minutes) {
    sleepForm.startTime = `${hours}:${minutes}`;
  } else {
    // 如果无法解析，使用默认值
    sleepForm.startTime = "22:00";
  }

  showStartTimePicker.value = false;
};

const onEndTimeConfirm = (value) => {
  console.log("End time picker value:", value);
  // Vant TimePicker 返回的是选中的值对象，需要提取时间值
  let hours, minutes;

  if (typeof value === "object" && value !== null) {
    // 对象格式 {selectedValues: [hour, minute, second], ...}
    if (value.selectedValues && Array.isArray(value.selectedValues)) {
      hours = String(value.selectedValues[0] || "00").padStart(2, "0");
      minutes = String(value.selectedValues[1] || "00").padStart(2, "0");
    } else if (value.hours !== undefined && value.minutes !== undefined) {
      // 对象格式 {hours, minutes}
      hours = String(value.hours || "00").padStart(2, "0");
      minutes = String(value.minutes || "00").padStart(2, "0");
    }
  } else if (Array.isArray(value)) {
    // 数组格式 [hour, minute, second]
    hours = String(value[0] || "00").padStart(2, "0");
    minutes = String(value[1] || "00").padStart(2, "0");
  }

  if (hours && minutes) {
    sleepForm.endTime = `${hours}:${minutes}`;
  } else {
    // 如果无法解析，使用默认值
    sleepForm.endTime = "06:30";
  }

  showEndTimePicker.value = false;
};

const onQualityConfirm = (value) => {
  console.log("Quality picker value:", value);
  // Vant Picker 返回的是选中的值
  // 如果value是对象，提取value属性；如果是字符串，直接使用
  sleepForm.quality =
    typeof value === "object" ? value.selectedValues[0] : value;
  showQualityPicker.value = false;
};

const renderSleepChart = () => {
  if (!sleepChartRef.value || recentRecords.value.length === 0) return;

  if (sleepChartInstance) {
    sleepChartInstance.dispose();
  }

  sleepChartInstance = echarts.init(sleepChartRef.value);

  const last7Records = recentRecords.value.slice(0, 7).reverse();
  const dates = last7Records.map((record) => record.date.substring(5));
  const durations = last7Records.map((record) => record.duration);
  const qualities = last7Records.map((record) => {
    const qualityScores = { 极好: 5, 良好: 4, 一般: 3, 较差: 2, 很差: 1 };
    return qualityScores[record.quality];
  });

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: function (params) {
        const record = last7Records[params[0].dataIndex];
        return `${record.date}<br/>时长: ${record.duration}小时<br/>质量: ${record.quality}`;
      },
    },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: [
      {
        type: "value",
        name: "时长(小时)",
        min: 0,
        max: 12,
      },
      {
        type: "value",
        name: "质量",
        min: 0,
        max: 5,
        interval: 1,
      },
    ],
    series: [
      {
        name: "睡眠时长",
        type: "bar",
        data: durations,
        itemStyle: {
          color: "#1989fa",
        },
      },
      {
        name: "睡眠质量",
        type: "line",
        yAxisIndex: 1,
        data: qualities,
        symbol: "circle",
        symbolSize: 8,
        itemStyle: {
          color: "#ff976a",
        },
        lineStyle: {
          width: 3,
        },
      },
    ],
  };

  sleepChartInstance.setOption(option);
};

// 加载睡眠记录
const loadSleepRecords = async () => {
  loading.value = true;
  try {
    const response = await getSleepRecords({ page: 1, limit: 20 });
    if (response.data.success) {
      recentRecords.value = response.data.data.records;
      nextTick(() => {
        renderSleepChart();
      });
    }
  } catch (error) {
    showFailToast(
      "加载记录失败：" + (error.response?.data?.message || error.message)
    );
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadSleepRecords();

  nextTick(() => {
    renderSleepChart();
  });

  window.addEventListener("resize", () => {
    if (sleepChartInstance) {
      sleepChartInstance.resize();
    }
  });
});
</script>

<style scoped>
.sleep-module {
  min-height: 100vh;
  background-color: #f7f8fa;
}
.module-content {
  padding: 16px;
}
.sleep-overview {
  margin-bottom: 16px;
}
.stat-card {
  background: white;
  border-radius: 8px;
  text-align: center;
}
.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #1989fa;
}
.stat-label {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}
.sleep-cycle-chart {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}
.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  text-align: center;
}
</style>
