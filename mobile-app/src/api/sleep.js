import http from './http';

// 获取睡眠记录列表
export const getSleepRecords = (params = {}) => {
  return http({
    url: '/sleep/records',
    method: 'GET',
    params
  });
};

// 创建睡眠记录
export const createSleepRecord = (data) => {
  return http({
    url: '/sleep/records',
    method: 'POST',
    data
  });
};

// 删除睡眠记录
export const deleteSleepRecord = (id) => {
  return http({
    url: `/sleep/records/${id}`,
    method: 'DELETE'
  });
};

// 获取睡眠统计摘要
export const getSleepSummary = (date) => {
  return http({
    url: '/sleep/stats/summary',
    method: 'GET',
    params: { date }
  });
};

// 获取睡眠趋势数据
export const getSleepTrend = (days = 7) => {
  return http({
    url: '/sleep/stats/trend',
    method: 'GET',
    params: { days }
  });
};