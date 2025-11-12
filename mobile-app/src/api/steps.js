import http from './http';

// 获取步数记录列表
export const getStepsRecords = (params = {}) => {
  return http.get('/steps', { params });
};

// 创建步数记录
export const createStepsRecord = (data) => {
  return http.post('/steps', data);
};

// 删除步数记录
export const deleteStepsRecord = (id) => {
  return http.delete(`/steps/${id}`);
};

// 获取步数统计
export const getStepsStats = (params = {}) => {
  return http.get('/steps/stats/summary', { params });
};

// 获取步数趋势数据
export const getStepsTrend = (params = {}) => {
  return http.get('/steps/stats/trend', { params });
};