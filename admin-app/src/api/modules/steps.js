// 步数记录相关API
import { request } from '../index.js';

export const stepsAPI = {
  /**
   * 获取步数记录列表（支持管理员指定 userId，支持日期范围与步数范围过滤）
   * @param {Object} params
   * @param {number} params.page
   * @param {number} params.limit
   * @param {number} [params.userId]
   * @param {string} [params.date]
   * @param {string} [params.startDate]
   * @param {string} [params.endDate]
   * @param {number} [params.minSteps]
   * @param {number} [params.maxSteps]
   */
  async getRecords(params = {}) {
    return request.get('/steps', params);
  },

  /**
   * 创建步数记录（管理员可指定 userId）
   */
  async createRecord(data = {}) {
    return request.post('/steps', data);
  },

  /** 删除步数记录 */
  async deleteRecord(id) {
    return request.delete(`/steps/${id}`);
  },

  /** 获取某日统计汇总（管理员可指定 userId） */
  async getSummary(params = {}) {
    return request.get('/steps/stats/summary', params);
  },

  /** 获取步数趋势 */
  async getTrend(params = {}) {
    return request.get('/steps/stats/trend', params);
  }
};