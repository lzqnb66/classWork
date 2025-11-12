// 用户管理相关API
import { request } from '../index.js';

/**
 * 用户管理API模块
 */
export const usersAPI = {
  /**
   * 获取用户列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {string} params.keyword - 搜索关键词
   * @returns {Promise} 用户列表
   */
  async getUsers(params = {}) {
    return request.get('/admin/users', params);
  },

  /**
   * 获取用户详情
   * @param {number} userId - 用户ID
   * @returns {Promise} 用户详情
   */
  async getUserDetail(userId) {
    return request.get(`/admin/users/${userId}`);
  },

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.password - 密码
   * @param {boolean} userData.is_admin - 是否为管理员
   * @returns {Promise} 创建结果
   */
  async createUser(userData) {
    return request.post('/admin/users', userData);
  },

  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Object} userData - 更新数据
   * @returns {Promise} 更新结果
   */
  async updateUser(userId, userData) {
    return request.put(`/admin/users/${userId}`, userData);
  },

  /**
   * 删除用户
   * @param {number} userId - 用户ID
   * @returns {Promise} 删除结果
   */
  async deleteUser(userId) {
    return request.delete(`/admin/users/${userId}`);
  },

  /**
   * 更新用户权限
   * @param {number} userId - 用户ID
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {Promise} 更新结果
   */
  async updateUserPermission(userId, isAdmin) {
    return request.patch(`/admin/users/${userId}/permission`, { is_admin: isAdmin });
  },

  /**
   * 获取用户统计信息
   * @returns {Promise} 统计信息
   */
  async getUserStats() {
    return request.get('/admin/users/stats');
  },
};