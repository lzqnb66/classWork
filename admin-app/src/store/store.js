import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';
import { authAPI } from '../api/modules/auth';
import { usersAPI } from '../api/modules/users';

export const useAuthStore = defineStore('admin-auth', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    user: JSON.parse(localStorage.getItem('admin_user') || '{}'),
    loading: false,
    error: null
  }),
  
  getters: { 
    isAuthed: (s) => !!s.token,
    isAdmin: (s) => s.user?.is_admin || false
  },
  
  actions: {
    async login(username, password) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await authAPI.login(username, password);
      
        if (response.data.success) {
            console.log('5')
          this.token = response.data.token;
          this.user = response.data.user;
          localStorage.setItem('admin_token', this.token);
          localStorage.setItem('admin_user', JSON.stringify(this.user));
          
          ElMessage.success('登录成功');
          return response.data;
        } else {
          throw new Error(response.data.message || '登录失败');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || '登录失败';
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    logout() {
      this.token = '';
      this.user = null;
      this.error = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      ElMessage.success('已退出登录');
    },
    
    async refreshUserInfo() {
      try {
        const response = await usersAPI.getCurrentUser();
        this.user = response.data;
        localStorage.setItem('admin_user', JSON.stringify(response.data));
      } catch (error) {
        console.error('刷新用户信息失败:', error);
      }
    },
    
    // 统一的API调用方法
    async apiCall(method, url, data = null, config = {}) {
      try {
        let response;
        switch (method.toLowerCase()) {
          case 'get':
            response = await authAPI.get(url, { ...config, params: data });
            break;
          case 'post':
            response = await authAPI.post(url, data, config);
            break;
          case 'put':
            response = await authAPI.put(url, data, config);
            break;
          case 'delete':
            response = await authAPI.delete(url, config);
            break;
          case 'patch':
            response = await authAPI.patch(url, data, config);
            break;
          default:
            throw new Error(`不支持的HTTP方法: ${method}`);
        }
        return response;
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || '请求失败';
        ElMessage.error(errorMessage);
        throw error;
      }
    },
    
    // 快捷方法
    async getData(url, params = {}, config = {}) {
      return this.apiCall('get', url, params, config);
    },
    
    async postData(url, data = {}, config = {}) {
      return this.apiCall('post', url, data, config);
    },
    
    async putData(url, data = {}, config = {}) {
      return this.apiCall('put', url, data, config);
    },
    
    async deleteData(url, config = {}) {
      return this.apiCall('delete', url, null, config);
    }
  }
});