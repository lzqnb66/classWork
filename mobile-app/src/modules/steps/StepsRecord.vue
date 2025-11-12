<template>
  <div class="steps-module">
    <!-- 顶部导航栏 -->
    <van-nav-bar 
      title="步数记录" 
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="module-content">
      <!-- 步数统计卡片 -->
      <van-row gutter="12" style="margin-bottom: 16px;">
        <van-col span="8">
          <van-cell-group>
            <van-cell title="今日步数" :value="todaySteps + ' 步'" />
          </van-cell-group>
        </van-col>
        <van-col span="8">
          <van-cell-group>
            <van-cell title="目标完成" :value="goalCompletion + '%'" />
          </van-cell-group>
        </van-col>
        <van-col span="8">
          <van-cell-group>
            <van-cell title="卡路里" :value="todayCalories + ' 卡'" />
          </van-cell-group>
        </van-col>
      </van-row>

      <!-- 步数趋势图 -->
      <div class="steps-chart" style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div class="chart-title">近7天步数趋势</div>
        <div ref="stepsChartRef" style="height: 180px;"></div>
      </div>

      <!-- 步数录入表单 -->
      <van-cell-group title="手动记录步数" style="margin-bottom: 16px;">
        <van-field
          v-model.number="stepsForm.steps"
          type="number"
          label="步数"
          placeholder="输入步数"
        />
        
        <van-field
          v-model="stepsForm.date"
          type="date"
          label="日期"
          placeholder="选择日期"
        />
        
        <van-field
          v-model="stepsForm.time"
          type="time"
          label="时间"
          placeholder="选择时间"
        />
        
        <van-field
          v-model="stepsForm.source"
          is-link
          readonly
          label="数据来源"
          placeholder="选择来源"
          @click="showSourcePicker = true"
        />
        
        <van-field
          v-model="stepsForm.notes"
          label="备注"
          type="textarea"
          placeholder="记录活动内容（如步行、跑步等）"
          rows="2"
          autosize
        />
      </van-cell-group>

      <!-- 操作按钮 -->
      <div style="padding: 0 16px; margin-bottom: 16px;">
        <van-button 
          type="primary" 
          size="large" 
          @click="submitSteps"
          :loading="submitting"
        >
          保存记录
        </van-button>
      </div>

      <!-- 今日步数记录列表 -->
      <van-cell-group title="今日步数记录">
        <van-empty v-if="todayRecords.length === 0" description="暂无记录" />
        
        <van-swipe-cell 
          v-for="record in todayRecords" 
          :key="record.id"
          :before-close="beforeClose"
        >
          <van-cell
            :title="record.steps + ' 步'"
            :value="record.time"
            :label="`${record.source} | ${record.notes || '无备注'}`"
          />
          <template #right>
            <van-button 
              square 
              type="danger" 
              text="删除" 
              @click="deleteRecord(record.id)"
            />
          </template>
        </van-swipe-cell>
      </van-cell-group>

      <!-- 健康建议 -->
      <div class="health-advice" style="background: #e8f4fd; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <div style="font-weight: bold; margin-bottom: 8px;">💪 健康建议</div>
        <div style="font-size: 14px; color: #666;">{{ healthAdvice }}</div>
      </div>
    </div>

    <!-- 数据来源选择器 -->
    <van-popup v-model:show="showSourcePicker" round position="bottom">
      <van-picker
        :columns="sourceOptions"
        @confirm="onSourceConfirm"
        @cancel="showSourcePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { showSuccessToast, showFailToast } from 'vant';
import * as echarts from 'echarts';
import { 
  getStepsRecords, 
  createStepsRecord, 
  deleteStepsRecord, 
  getStepsStats, 
  getStepsTrend 
} from '../../api/steps';

const stepsForm = reactive({
  steps: 0,
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  source: '',
  notes: ''
});

const showSourcePicker = ref(false);
const submitting = ref(false);
const stepsChartRef = ref(null);
let stepsChartInstance = null;

const sourceOptions = [
  { text: '手机计步', value: '手机计步' },
  { text: '手环', value: '手环' },
  { text: '手表', value: '手表' },
  { text: '手动记录', value: '手动记录' }
];

const stepsRecords = ref([]);
const loading = ref(false);

// 计算今日步数
const todaySteps = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return stepsRecords.value
    .filter(record => record.date === today)
    .reduce((sum, record) => sum + record.steps, 0);
});

// 加载步数记录
const loadStepsRecords = async () => {
  try {
    loading.value = true;
    const response = await getStepsRecords({ 
      date: new Date().toISOString().split('T')[0] 
    });
    
    if (response.data.success) {
      stepsRecords.value = response.data.data.records;
    }
  } catch (error) {
    showFailToast('加载记录失败');
  } finally {
    loading.value = false;
  }
};

// 加载步数趋势数据
const loadStepsTrend = async () => {
  try {
    const response = await getStepsTrend({ days: 7 });
    if (response.data.success) {
      return response.data.data;
    }
  } catch (error) {
    console.error('加载趋势数据失败:', error);
  }
  return [];
};

// 计算目标完成度（假设目标为10000步）
const goalCompletion = computed(() => {
  const goal = 10000;
  return Math.min(Math.round((todaySteps.value / goal) * 100), 100);
});

// 计算消耗卡路里（假设每步消耗0.04卡路里）
const todayCalories = computed(() => {
  return Math.round(todaySteps.value * 0.04);
});

// 获取今日记录
const todayRecords = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return stepsRecords.value
    .filter(record => record.date === today)
    .sort((a, b) => b.time.localeCompare(a.time));
});

// 健康建议
const healthAdvice = computed(() => {
  if (todaySteps.value >= 10000) {
    return '恭喜！您已完成今日步数目标，继续保持活跃的生活习惯！';
  } else if (todaySteps.value >= 8000) {
    return '接近目标了！再走一会儿就能完成10000步的目标，加油！';
  } else if (todaySteps.value >= 5000) {
    return '不错的活动量！建议增加一些步行时间，争取达到10000步。';
  } else {
    return '活动量偏少，建议多走动，如步行上班、午休散步等来增加步数。';
  }
});

// 提交步数记录
const submitSteps = async () => {
  if (!stepsForm.steps || stepsForm.steps <= 0) {
    showFailToast('请输入有效的步数');
    return;
  }
  
  if (!stepsForm.source) {
    showFailToast('请选择数据来源');
    return;
  }
  
  submitting.value = true;
  
  try {
    const response = await createStepsRecord({
      steps: stepsForm.steps,
      date: stepsForm.date,
      time: stepsForm.time,
      source: stepsForm.source,
      notes: stepsForm.notes
    });
    
    if (response.data.success) {
      stepsRecords.value.unshift(response.data.data);
      
      // 重置表单
      stepsForm.steps = 0;
      stepsForm.notes = '';
      
      showSuccessToast('步数记录保存成功');
      
      // 重新渲染图表
      nextTick(() => {
        renderChart();
      });
    } else {
      showFailToast(response.data.message || '保存失败');
    }
    
  } catch (error) {
    showFailToast('保存失败：' + error.message);
  } finally {
    submitting.value = false;
  }
};

// 删除记录
const deleteRecord = async (id) => {
  try {
    const response = await deleteStepsRecord(id);
    if (response.data.success) {
      stepsRecords.value = stepsRecords.value.filter(record => record.id !== id);
      showSuccessToast('记录已删除');
      
      nextTick(() => {
        renderChart();
      });
    } else {
      showFailToast(response.data.message || '删除失败');
    }
  } catch (error) {
    showFailToast('删除失败：' + error.message);
  }
};

// 滑动删除确认
const beforeClose = ({ position, instance }) => {
  switch (position) {
    case 'left':
    case 'cell':
    case 'outside':
      instance.close();
      break;
    case 'right':
      instance.close();
      break;
  }
};

// 数据来源选择确认
const onSourceConfirm = (value) => {
  console.log(value)
  stepsForm.source = value.selectedValues[0] || value;
  showSourcePicker.value = false;
};

// 渲染步数趋势图
const renderChart = async () => {
  if (!stepsChartRef.value) return;
  
  if (stepsChartInstance) {
    stepsChartInstance.dispose();
  }
  
  stepsChartInstance = echarts.init(stepsChartRef.value);
  
  // 获取最近7天趋势数据
  const trendData = await loadStepsTrend();
  
  // 如果后端趋势数据为空或有问题，使用前端数据生成趋势
  let chartData;
  let last7Days;
  
  if (trendData && trendData.length > 0) {
    last7Days = trendData.map(item => item.date);
    chartData = trendData.map(item => item.steps);
  } else {
    // 使用前端数据生成最近7天趋势
    last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    chartData = last7Days.map(date => {
      const dayRecords = stepsRecords.value.filter(record => record.date === date);
      return dayRecords.reduce((sum, record) => sum + record.steps, 0);
    });
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{c} 步'
    },
    xAxis: {
      type: 'category',
      data: last7Days.map(date => date.slice(5)), // 显示月-日
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '步数'
    },
    series: [{
      data: chartData,
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#1989fa'
      },
      itemStyle: {
        color: '#1989fa'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(25, 137, 250, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(25, 137, 250, 0.1)'
          }]
        }
      }
    }]
  };
  
  stepsChartInstance.setOption(option);
};

// 初始化图表和数据
onMounted(() => {
  loadStepsRecords();
  
  nextTick(() => {
    renderChart();
  });
  
  // 窗口大小变化时重绘图表
  window.addEventListener('resize', () => {
    if (stepsChartInstance) {
      stepsChartInstance.resize();
    }
  });
});

// 组件卸载时销毁图表
onUnmounted(() => {
  if (stepsChartInstance) {
    stepsChartInstance.dispose();
    stepsChartInstance = null;
  }
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
.steps-module {
  min-height: 100vh;
  background: #f7f8fa;
}

.module-content {
  padding: 16px;
}

.chart-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.stat-card {
  text-align: center;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #1989fa;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.health-advice {
  border-left: 4px solid #1989fa;
}
</style>