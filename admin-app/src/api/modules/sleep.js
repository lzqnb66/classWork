// 睡眠记录相关API（Admin）
import { request } from '../index.js';

export const sleepAPI = {
  /**
   * 获取睡眠记录列表（支持管理员指定 userId，支持日期范围与时长范围过滤）
   * @param {Object} params
   * @param {number} params.page
   * @param {number} params.limit
   * @param {number} [params.userId]
   * @param {string} [params.date]
   * @param {string} [params.startDate]
   * @param {string} [params.endDate]
   * @param {number} [params.minHours]
   * @param {number} [params.maxHours]
   */
  async getRecords(params = {}) {
    return request.get('/sleep/records', params);
  },

  /**
   * 创建睡眠记录（管理员可指定 userId）
   */
  async createRecord(data = {}) {
    return request.post('/sleep/records', data);
  },

  /** 删除睡眠记录 */
  async deleteRecord(id) {
    return request.delete(`/sleep/records/${id}`);
  },

  /** 获取某日统计汇总（管理员可指定 userId） */
  async getSummary(params = {}) {
    return request.get('/sleep/stats/summary', params);
  },

  /** 获取睡眠趋势 */
  async getTrend(params = {}) {
    return request.get('/sleep/stats/trend', params);
  }
};