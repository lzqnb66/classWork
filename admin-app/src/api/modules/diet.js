// 饮食记录相关API（对接 server/src/routes/diet.ts）
import { request } from '../index.js';

export const dietAPI = {
  /**
   * 获取饮食记录列表（分页）
   * @param {{ page?: number, limit?: number, userId?: number, foodName?: string, startDate?: string, endDate?: string }} params
   */
  async getRecords(params = {}) {
    return request.get('/diet', params);
  },

  /**
   * 创建饮食记录
   * @param {{ userId?: number, foodName: string, calories: number, protein?: number, carbs?: number, fat?: number, mealType?: string, quantity?: number, unit?: string, date?: string, time?: string }} data
   */
  async createRecord(data = {}) {
    return request.post('/diet', data);
  },

  /**
   * 删除饮食记录
   * @param {number|string} id
   */
  async deleteRecord(id) {
    return request.delete(`/diet/${id}`);
  },

  /**
   * 获取某日饮食统计汇总
   * @param {{ date?: string, userId?: number }} params
   */
  async getSummary(params = {}) {
    return request.get('/diet/stats/summary', params);
  }
};