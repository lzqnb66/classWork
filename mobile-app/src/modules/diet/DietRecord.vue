<template>
  <div class="diet-module">
    <!-- 顶部导航 -->
    <van-nav-bar 
      title="饮食记录" 
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="module-content">
      <!-- 快速统计卡片 -->
      <van-row gutter="12" style="margin-bottom: 16px;">
        <van-col span="8">
          <van-cell-group>
            <van-cell title="今日摄入" :value="todayCalories + ' 卡'" />
          </van-cell-group>
        </van-col>
        <van-col span="8">
          <van-cell-group>
            <van-cell title="蛋白质" :value="todayProtein + ' g'" />
          </van-cell-group>
        </van-col>
        <van-col span="8">
          <van-cell-group>
            <van-cell title="碳水" :value="todayCarbs + ' g'" />
          </van-cell-group>
        </van-col>
      </van-row>

      <!-- 饮食录入表单 -->
      <van-cell-group title="新增饮食记录" style="margin-bottom: 16px;">
        <van-field
          v-model="dietForm.foodName"
          label="食物名称"
          placeholder="输入食物名称"
          @input="searchFoods"
        />
        
        <!-- 智能食物建议 -->
        <div v-if="foodSuggestions.length > 0" class="food-suggestions">
          <van-tag
            v-for="food in foodSuggestions"
            :key="food.id"
            type="primary"
            size="medium"
            style="margin: 4px;"
            @click="selectFood(food)"
          >
            {{ food.name }}
          </van-tag>
        </div>

        <van-field
          v-model.number="dietForm.calories"
          type="number"
          label="热量(卡)"
          placeholder="卡路里"
        />
        
        <van-field
          v-model.number="dietForm.protein"
          type="number"
          label="蛋白质(g)"
          placeholder="蛋白质含量"
        />
        
        <van-field
          v-model.number="dietForm.carbs"
          type="number"
          label="碳水(g)"
          placeholder="碳水化合物"
        />
        
        <van-field
          v-model.number="dietForm.fat"
          type="number"
          label="脂肪(g)"
          placeholder="脂肪含量"
        />
        
        <van-field
          v-model="dietForm.mealType"
          is-link
          readonly
          label="餐次"
          placeholder="选择餐次"
          @click="showMealTypePicker = true"
        />
        
        <van-field
          v-model="dietForm.date"
          type="date"
          label="日期"
          placeholder="选择日期"
        />
        
        <van-field
          v-model="dietForm.time"
          type="time"
          label="时间"
          placeholder="选择时间"
        />
        
        <van-field
          v-model.number="dietForm.quantity"
          type="number"
          label="份量"
          placeholder="份数或重量"
        />
        
        <van-field
          v-model="dietForm.unit"
          label="单位"
          placeholder="g/ml/份"
        />
      </van-cell-group>

      <!-- 操作按钮 -->
      <div style="padding: 0 16px;">
        <van-button 
          type="primary" 
          size="large" 
          @click="submitDiet"
          :loading="submitting"
        >
          保存记录
        </van-button>
      </div>

      <!-- 今日饮食记录列表 -->
      <van-cell-group title="今日饮食记录" style="margin-top: 24px;">
        <van-empty v-if="todayRecords.length === 0" description="暂无记录" />
        
        <van-swipe-cell 
          v-for="record in todayRecords" 
          :key="record.id"
          :before-close="beforeClose"
        >
          <van-cell
            :title="record.foodName"
            :value="record.calories + ' 卡'"
            :label="`${record.mealType} | ${record.quantity}${record.unit}`"
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
    </div>

    <!-- 餐次选择器 -->
    <van-popup v-model:show="showMealTypePicker" round position="bottom">
      <van-picker
        :columns="mealTypes"
        @confirm="onMealTypeConfirm"
        @cancel="showMealTypePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { showSuccessToast, showFailToast } from 'vant';
import { useAuthStore } from '../../store/auth';
import http from '../../api/http';

const auth = useAuthStore();

// 食物数据库（简化版）
const foodDatabase = [
  { id: 1, name: '鸡胸肉', calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: '100g' },
  { id: 2, name: '米饭', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: '100g' },
  { id: 3, name: '鸡蛋', calories: 155, protein: 13, carbs: 1.1, fat: 11, unit: '个' },
  { id: 4, name: '牛奶', calories: 61, protein: 3.3, carbs: 4.8, fat: 3.3, unit: '100ml' },
  { id: 5, name: '苹果', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: '个' },
  { id: 6, name: '香蕉', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: '个' },
  { id: 7, name: '牛肉', calories: 250, protein: 26, carbs: 0, fat: 15, unit: '100g' },
  { id: 8, name: '鱼肉', calories: 206, protein: 22, carbs: 0, fat: 13, unit: '100g' },
  { id: 9, name: '面包', calories: 265, protein: 9, carbs: 49, fat: 3.2, unit: '片' },
  { id: 10, name: '燕麦', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, unit: '100g' }
];

const dietForm = reactive({
  foodName: '',
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  mealType: '',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  quantity: 1,
  unit: '份'
});

const foodSuggestions = ref([]);
const showMealTypePicker = ref(false);
const submitting = ref(false);
const todayRecords = ref([]);

const mealTypes = [
  { text: '早餐', value: 'breakfast' },
  { text: '午餐', value: 'lunch' },
  { text: '晚餐', value: 'dinner' },
  { text: '加餐', value: 'snack' },
  { text: '零食', value: 'other' }
];

// 计算今日总营养
const todayCalories = computed(() => 
  todayRecords.value.reduce((sum, record) => sum + (record.calories || 0), 0)
);

const todayProtein = computed(() => 
  todayRecords.value.reduce((sum, record) => sum + (record.protein || 0), 0)
);

const todayCarbs = computed(() => 
  todayRecords.value.reduce((sum, record) => sum + (record.carbs || 0), 0)
);

// 搜索食物建议
function searchFoods() {
  if (!dietForm.foodName.trim()) {
    foodSuggestions.value = [];
    return;
  }
  
  const searchTerm = dietForm.foodName.toLowerCase();
  foodSuggestions.value = foodDatabase.filter(food => 
    food.name.toLowerCase().includes(searchTerm)
  ).slice(0, 5);
}

// 选择食物
function selectFood(food) {
  dietForm.foodName = food.name;
  dietForm.calories = food.calories;
  dietForm.protein = food.protein;
  dietForm.carbs = food.carbs;
  dietForm.fat = food.fat;
  dietForm.unit = food.unit;
  foodSuggestions.value = [];
}

// 选择餐次
function onMealTypeConfirm({ selectedOptions }) {
  dietForm.mealType = selectedOptions[0].value;
  showMealTypePicker.value = false;
}

// 提交饮食记录
async function submitDiet() {
  if (!dietForm.foodName.trim()) {
    showFailToast('请输入食物名称');
    return;
  }
  
  if (!dietForm.calories) {
    showFailToast('请输入热量');
    return;
  }
  
  submitting.value = true;
  
  try {
    const payload = {
      foodName: dietForm.foodName,
      calories: dietForm.calories,
      protein: dietForm.protein || 0,
      carbs: dietForm.carbs || 0,
      fat: dietForm.fat || 0,
      mealType: dietForm.mealType,
      quantity: dietForm.quantity,
      unit: dietForm.unit,
      date: dietForm.date,
      time: dietForm.time
    };
    
    await http.post('/diet', payload);
    showSuccessToast('饮食记录已保存');
    
    // 重置表单
    Object.assign(dietForm, {
      foodName: '',
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      mealType: '',
      quantity: 1,
      unit: '份'
    });
    
    // 重新加载今日记录
    loadTodayRecords();
    
  } catch (error) {
    showFailToast(error?.response?.data?.message || '保存失败');
  } finally {
    submitting.value = false;
  }
}

// 加载今日记录
async function loadTodayRecords() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await http.get('/diet', {
      params: { 
        startDate: today, 
        endDate: today
      }
    });
    todayRecords.value = data.data.records;
  } catch (error) {
    console.error('加载记录失败:', error);
  }
}

// 删除记录
async function deleteRecord(id) {
  try {
    await http.delete(`/diet/${id}`);
    showSuccessToast('已删除');
    loadTodayRecords();
  } catch (error) {
    showFailToast('删除失败');
  }
}

// 滑动删除确认
function beforeClose({ position, instance }) {
  switch (position) {
    case 'left':
    case 'cell':
    case 'outside':
      instance.close();
      break;
    case 'right':
      Dialog.confirm({
        message: '确定删除吗？',
      }).then(() => {
        instance.close();
      });
      break;
  }
}

onMounted(() => {
  loadTodayRecords();
});
</script>

<style scoped>
.diet-module {
  min-height: 100vh;
  background: #f7f8fa;
}

.module-content {
  padding: 16px;
}

.food-suggestions {
  padding: 0 16px 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.van-cell-group__title) {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  padding: 16px 16px 8px 16px;
}

:deep(.van-cell__value) {
  color: #ee0a24;
  font-weight: 500;
}

:deep(.van-cell__label) {
  font-size: 12px;
  color: #969799;
}
</style>