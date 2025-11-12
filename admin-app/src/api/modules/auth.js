// 认证相关API
import { request } from '../index.js';

/**
 * 认证API模块
 */
export const authAPI = {
  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise} 登录结果
   */
  async login(username, password) {
    return request.post('/auth/login', { username, password });
  },

  /**
   * 用户登出
   * @returns {Promise} 登出结果
   */
  async logout() {
    return request.post('/auth/logout');
  },

  /**
   * 刷新token
   * @returns {Promise} 刷新结果
   */
  async refreshToken() {
    return request.post('/auth/refresh');
  },

  /**
   * 获取当前用户信息
   * @returns {Promise} 用户信息
   */
  async getCurrentUser() {
    return request.get('/auth/me');
  },

  /**
   * 修改密码
   * @param {string} oldPassword - 旧密码
   * @param {string} newPassword - 新密码
   * @returns {Promise} 修改结果
   */
  async changePassword(oldPassword, newPassword) {
    return request.put('/auth/password', { oldPassword, newPassword });
  },
};