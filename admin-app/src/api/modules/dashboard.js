// 仪表盘相关API
import { request } from '../index.js';

/**
 * 仪表盘API模块
 */
export const dashboardAPI = {
  /**
   * 获取仪表盘统计数据
   * @returns {Promise} 统计数据
   */
  async getDashboardStats() {
    return request.get('/admin/dashboard/stats');
  },

  /**
   * 获取用户增长趋势
   * @param {Object} params - 查询参数
   * @param {string} params.period - 时间周期 (day, week, month)
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @returns {Promise} 用户增长数据
   */
  async getUserGrowth(params = {}) {
    return request.get('/admin/dashboard/user-growth', params);
  },

  /**
   * 获取记录增长趋势
   * @param {Object} params - 查询参数
   * @param {string} params.type - 记录类型
   * @param {string} params.period - 时间周期
   * @returns {Promise} 记录增长数据
   */
  async getRecordGrowth(params = {}) {
    return request.get('/admin/dashboard/record-growth', params);
  },

  /**
   * 获取活跃用户统计
   * @param {Object} params - 查询参数
   * @param {string} params.days - 天数
   * @returns {Promise} 活跃用户数据
   */
  async getActiveUsers(params = {}) {
    return request.get('/admin/dashboard/active-users', params);
  },

  /**
   * 获取健康数据趋势
   * @param {Object} params - 查询参数
   * @param {string} params.type - 数据类型 (steps, sleep)
   * @param {string} params.period - 时间周期
   * @returns {Promise} 健康趋势数据
   */
  async getHealthTrend(params = {}) {
    return request.get('/admin/dashboard/health-trend', params);
  },

  /**
   * 获取实时数据
   * @returns {Promise} 实时数据
   */
  async getRealtimeData() {
    return request.get('/admin/dashboard/realtime');
  },

  /**
   * 获取系统状态
   * @returns {Promise} 系统状态
   */
  async getSystemStatus() {
    return request.get('/admin/dashboard/system-status');
  },
};