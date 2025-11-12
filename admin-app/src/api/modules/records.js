// 健康记录相关API
import { request } from '../index.js';

/**
 * 健康记录API模块
 */
export const recordsAPI = {
  /**
   * 获取记录列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {string} params.type - 记录类型 (steps, sleep, diet)
   * @param {number} params.userId - 用户ID
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @returns {Promise} 记录列表
   */
  async getRecords(params = {}) {
    return request.get('/admin/records', params);
  },

  /**
   * 获取记录详情
   * @param {number} recordId - 记录ID
   * @returns {Promise} 记录详情
   */
  async getRecordDetail(recordId) {
    return request.get(`/admin/records/${recordId}`);
  },

  /**
   * 创建记录
   * @param {Object} recordData - 记录数据
   * @param {string} recordData.type - 记录类型
   * @param {number} recordData.user_id - 用户ID
   * @param {string} recordData.date - 日期
   * @param {any} recordData.data - 记录数据
   * @returns {Promise} 创建结果
   */
  async createRecord(recordData) {
    return request.post('/admin/records', recordData);
  },

  /**
   * 更新记录
   * @param {number} recordId - 记录ID
   * @param {Object} recordData - 更新数据
   * @returns {Promise} 更新结果
   */
  async updateRecord(recordId, recordData) {
    return request.put(`/admin/records/${recordId}`, recordData);
  },

  /**
   * 删除记录
   * @param {number} recordId - 记录ID
   * @returns {Promise} 删除结果
   */
  async deleteRecord(recordId) {
    return request.delete(`/admin/records/${recordId}`);
  },

  /**
   * 获取记录统计信息
   * @param {Object} params - 查询参数
   * @param {string} params.type - 记录类型
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @returns {Promise} 统计信息
   */
  async getRecordsStats(params = {}) {
    return request.get('/admin/records/stats', params);
  },

  /**
   * 批量删除记录
   * @param {number[]} recordIds - 记录ID数组
   * @returns {Promise} 删除结果
   */
  async batchDeleteRecords(recordIds) {
    return request.post('/admin/records/batch-delete', { ids: recordIds });
  },

  /**
   * 导出记录数据
   * @param {Object} params - 查询参数
   * @returns {Promise} 导出文件
   */
  async exportRecords(params = {}) {
    return request.get('/admin/records/export', {
      ...params,
      responseType: 'blob',
    });
  },
};