<template>
  <div class="query-module">
    <van-nav-bar
      title="数据查询"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="module-content">
      <van-cell-group title="查询条件" style="margin-bottom: 16px">
        <van-field
          v-model="queryForm.dataType"
          is-link
          readonly
          label="数据类型"
          placeholder="选择类型"
          @click="showDataTypePicker = true"
        />
        <van-field
          v-model="queryForm.startDate"
          is-link
          readonly
          label="开始日期"
          placeholder="选择开始日期"
          @click="showStartDatePicker = true"
        />
        <van-field
          v-model="queryForm.endDate"
          is-link
          readonly
          label="结束日期"
          placeholder="选择结束日期"
          @click="showEndDatePicker = true"
        />
        <van-field
          v-model="queryForm.timeRange"
          is-link
          readonly
          label="时间范围"
          placeholder="选择时间范围"
          @click="showTimeRangePicker = true"
        />
        <van-field
          v-model="queryForm.sortOrder"
          is-link
          readonly
          label="排序方式"
          placeholder="选择排序"
          @click="showSortPicker = true"
        />
        <van-field
          v-model="queryForm.keyword"
          label="关键词"
          placeholder="输入关键词搜索"
        />
      </van-cell-group>

      <div style="padding: 0 16px; margin-bottom: 16px">
        <van-button
          type="primary"
          size="large"
          @click="executeQuery"
          :loading="querying"
          style="margin-bottom: 8px"
          >执行查询</van-button
        >
        <van-button size="large" @click="resetQuery">重置条件</van-button>
      </div>

      <div v-if="queryResult.length > 0" class="query-results">
        <van-cell-group title="查询结果">
          <van-cell title="记录总数" :value="queryResult.length + ' 条'" />
          <van-cell title="时间范围" :value="resultTimeRange" />
        </van-cell-group>

        <!-- <div
          class="chart-container"
          style="
            background: white;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
          "
        >
          <div class="chart-title">数据趋势图</div>
          <div ref="chartRef" style="height: 200px"></div>
        </div> -->

        <van-cell-group title="详细数据">
          <van-swipe-cell
            v-for="item in queryResult"
            :key="item.id"
            :before-close="beforeClose"
          >
            <van-cell
              :title="getItemTitle(item)"
              :value="getItemValue(item)"
              :label="getItemLabel(item)"
            >
              <template #icon>
                <div class="record-type-icon" :class="getRecordTypeClass(item.type)">
                  {{ getRecordTypeAbbr(item.type) }}
                </div>
              </template>
              <template #extra>
                <van-tag 
                  :type="getRecordTagType(item.type)"
                  size="small"
                >
                  {{ item.type }}
                </van-tag>
              </template>
            </van-cell>
            <!-- <template #right>
              <van-button
                square
                type="danger"
                text="删除"
                @click="deleteItem(item.id)"
                style="height: 100%"
              />
              <van-button
                square
                type="primary"
                text="导出"
                @click="exportItem(item)"
                style="height: 100%"
              />
            </template> -->
          </van-swipe-cell>
        </van-cell-group>
      </div>

      <van-empty v-else-if="queryExecuted" description="暂无查询结果" />
    </div>

    <van-popup v-model:show="showDataTypePicker" round position="bottom">
      <van-picker
        :columns="dataTypeOptions"
        title="选择数据类型"
        @confirm="onDataTypeConfirm"
        @cancel="showDataTypePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showStartDatePicker" round position="bottom">
      <van-date-picker
        v-model="startDateValue"
        title="选择开始日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onStartDateConfirm"
        @cancel="showStartDatePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showEndDatePicker" round position="bottom">
      <van-date-picker
        v-model="endDateValue"
        title="选择结束日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onEndDateConfirm"
        @cancel="showEndDatePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showTimeRangePicker" round position="bottom">
      <van-time-picker
        v-model="timeRangeValue"
        title="选择时间范围"
        @confirm="onTimeRangeConfirm"
        @cancel="showTimeRangePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showSortPicker" round position="bottom">
      <van-picker
        :columns="sortOptions"
        title="选择排序方式"
        @confirm="onSortConfirm"
        @cancel="showSortPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { showSuccessToast, showFailToast } from "vant";
import * as queryApi from "../../api/query";

const queryForm = reactive({
  dataType: "",
  startDate: "",
  endDate: "",
  timeRange: "",
  sortOrder: "",
  keyword: "",
});

const showDataTypePicker = ref(false);
const showStartDatePicker = ref(false);
const showEndDatePicker = ref(false);
const showTimeRangePicker = ref(false);
const showSortPicker = ref(false);
const querying = ref(false);
const queryExecuted = ref(false);
const chartRef = ref(null);
let chartInstance = null; 

const startDateValue = ref([new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate().toString().padStart(2, "0")]);
const endDateValue = ref([new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate().toString().padStart(2, "0")]);
const timeRangeValue = ref(["00:00", "23:59"]);

// 日期选择器范围限制
const minDate = new Date(2010, 0, 1);
const maxDate = new Date();

const dataTypeOptions = [
  { text: "全部", value: "全部" },
  { text: "饮食记录", value: "饮食记录" },
  { text: "步数记录", value: "步数记录" },
  { text: "睡眠记录", value: "睡眠记录" },
];
const sortOptions = [
  { text: "时间升序", value: "时间升序" },
  { text: "时间降序", value: "时间降序" },
  { text: "数值升序", value: "数值升序" },
  { text: "数值降序", value: "数值降序" },
];

const queryResult = ref([]);

const resultTimeRange = computed(() => {
  if (queryResult.value.length === 0) return "无数据";
  const dates = queryResult.value.map((item) => item.date);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  return `${minDate} 至 ${maxDate}`;
});

const executeQuery = async () => {
  try {
    querying.value = true;
    
    // 准备查询参数
    const queryParams = {};
    
    if (queryForm.dataType) {
      queryParams.dataType = queryForm.dataType;
    }
    
    if (queryForm.startDate) {
      queryParams.startDate = queryForm.startDate;
    }
    
    if (queryForm.endDate) {
      queryParams.endDate = queryForm.endDate;
    }
    
    // 处理时间范围
    if (queryForm.timeRange) {
      const [startTime, endTime] = queryForm.timeRange.split(' 至 ');
      queryParams.startTime = startTime;
      queryParams.endTime = endTime;
    }
    
    if (queryForm.sortOrder) {
      queryParams.sortOrder = queryForm.sortOrder;
    }
    
    if (queryForm.keyword) {
      queryParams.keyword = queryForm.keyword;
    }
    
    // 执行查询
    const response = await queryApi.advancedQuery(queryParams);
    queryResult.value = response.data || [];
    queryExecuted.value = true;
    
    if (queryResult.value.length === 0) {
      showSuccessToast('查询完成，暂无数据');
    } else {
      showSuccessToast(`查询完成，共找到 ${queryResult.value.length} 条记录`);
    }
    
  } catch (error) {
    console.error('查询失败:', error);
    showFailToast('查询失败: ' + (error.response?.data?.message || error.message));
    queryResult.value = [];
  } finally {
    querying.value = false;
  }
};

const resetQuery = () => {
  queryForm.dataType = "";
  queryForm.startDate = "";
  queryForm.endDate = "";
  queryForm.timeRange = "";
  queryForm.sortOrder = "";
  queryForm.keyword = "";
  queryResult.value = [];
  queryExecuted.value = false;
  showSuccessToast("查询条件已重置");
};

const getItemTitle = (item) => {
  switch (item.type) {
    case "饮食记录":
      return `${item.food} - ${item.value} ${item.unit}`;
    case "步数记录":
      return `${item.value} ${item.unit}`;
    case "睡眠记录":
      return `${item.value} ${item.unit} - ${item.quality || ''}`;
    default:
      return item.type;
  }
};

const getItemValue = (item) => {
  return `${item.date} ${item.time}`;
};

const getItemLabel = (item) => {
  switch (item.type) {
    case "饮食记录":
      return item.notes;
    case "步数记录":
      return `${item.source} - ${item.notes}`;
    case "睡眠记录":
      return item.notes;
    default:
      return "";
  }
};

const getRecordTypeClass = (type) => {
  switch (type) {
    case "饮食记录":
      return "record-type-diet";
    case "睡眠记录":
      return "record-type-sleep";
    case "步数记录":
      return "record-type-steps";
    default:
      return "record-type-default";
  }
};

const getRecordTypeAbbr = (type) => {
  switch (type) {
    case "饮食记录":
      return "食";
    case "睡眠记录":
      return "睡";
    case "步数记录":
      return "步";
    default:
      return "记";
  }
};

const getRecordTagType = (type) => {
  switch (type) {
    case "饮食记录":
      return "primary";
    case "睡眠记录":
      return "success";
    case "步数记录":
      return "warning";
    default:
      return "default";
  }
};

const deleteItem = async (id) => {
  try {
    await queryApi.deleteRecord(id);
    queryResult.value = queryResult.value.filter((item) => item.id !== id);
    showSuccessToast("记录已删除");
  } catch (error) {
    console.error("删除失败:", error);
    showFailToast(
      "删除失败：" + (error.response?.data?.message || error.message)
    );
  }
};

const exportItem = (item) => {
  queryApi.exportRecord(item);
  showSuccessToast("记录已导出");
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

const onDataTypeConfirm = (value) => {
  console.log(value);
  queryForm.dataType = value.selectedValues[0] || value;
  showDataTypePicker.value = false;
};

const onStartDateConfirm = (value) => {
  console.log(value);
  // 处理Vant日期选择器返回的格式
  const formatDateFromPicker = (pickerValue) => {
    const [year, month, day] = pickerValue.selectedValues;
    return `${year}-${month}-${day}`;
  };

  queryForm.startDate = formatDateFromPicker(value);
  showStartDatePicker.value = false;
};

const onEndDateConfirm = (value) => {
  console.log(value);
  // 处理Vant日期选择器返回的格式
  const formatDateFromPicker = (pickerValue) => {
    const [year, month, day] = pickerValue.selectedValues;
    return `${year}-${month}-${day}`;
  };

  queryForm.endDate = formatDateFromPicker(value);
  showEndDatePicker.value = false;
};

const onTimeRangeConfirm = (value) => {
  console.log(value);
  const [start, end] = value.selectedValues;

  // 确保时间格式正确
  const formatTime = (time) => {
    if (time.includes(":")) {
      return time;
    }
    // 如果是数字格式，转换为时间格式
    const hours = parseInt(time);
    return `${String(hours).padStart(2, "0")}:00`;
  };

  const formattedStart = formatTime(start);
  const formattedEnd = formatTime(end);
  console.log(formattedStart, formattedEnd);
  // 验证开始时间不能超过结束时间
  if (formattedStart > formattedEnd) {
    showFailToast("开始时间不能超过结束时间");
    return; // 不关闭选择器，让用户重新选择
  }

  queryForm.timeRange = `${formattedStart} 至 ${formattedEnd}`;
  showTimeRangePicker.value = false;
};

const onSortConfirm = (value) => {
  queryForm.sortOrder = value.selectedValues[0] || value;
  showSortPicker.value = false;
};

</script>

<style scoped>
.query-module {
  min-height: 100vh;
  background-color: #f7f8fa;
}
.module-content {
  padding: 16px;
}
.chart-container {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  text-align: center;
}

.record-type-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.record-type-diet {
  background-color: #1989fa;
}

.record-type-sleep {
  background-color: #07c160;
}

.record-type-steps {
  background-color: #ff976a;
}

.record-type-default {
  background-color: #969799;
}

.van-cell__value {
  text-align: right;
  flex: 1;
}

.van-cell__extra {
  margin-left: 8px;
}
</style>
