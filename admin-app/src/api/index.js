// API 基础配置和实例
import axios from 'axios';
import { ElMessage } from 'element-plus';

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3789/api';

// 创建基础 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证 token
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 记录请求日志（开发环境）
    if (import.meta.env.DEV) {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, config);
    }
    
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('❌ Request Interceptor Error:', error);
    }
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 记录响应日志（开发环境）
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`, response.data);
    }
    
    // 统一处理响应数据格式
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers,
    };
  },
  (error) => {
    // 记录错误日志
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', error);
    }
    
    const { response, code } = error;
    
    // 统一错误处理
    if (response?.status === 401) {
      // token过期或无效
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      ElMessage.error('登录已过期，请重新登录');
      // window.location.href = '/login';
    } else if (response?.status === 403) {
      ElMessage.error('权限不足，无法访问该资源');
    } else if (response?.status === 404) {
      ElMessage.error('请求的资源不存在');
    } else if (response?.status >= 500) {
      ElMessage.error('服务器内部错误，请稍后重试');
    } else if (code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接');
    } else if (!response) {
      ElMessage.error('网络错误，请检查网络连接');
    } else {
      // 其他错误
      const errorMessage = response.data?.message || error.message || '请求失败';
      ElMessage.error(errorMessage);
    }
    
    return Promise.reject({
      success: false,
      status: response?.status,
      message: response?.data?.message || error.message,
      data: response?.data,
      error: error,
    });
  }
);

// 基础请求方法封装
export const request = {
  // GET 请求
  async get(url, params = {}, config = {}) {
    try {
      const response = await api.get(url, { ...config, params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // POST 请求
  async post(url, data = {}, config = {}) {
    try {
      const response = await api.post(url, data, config);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // PUT 请求
  async put(url, data = {}, config = {}) {
    try {
      const response = await api.put(url, data, config);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // DELETE 请求
  async delete(url, config = {}) {
    try {
      const response = await api.delete(url, config);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // PATCH 请求
  async patch(url, data = {}, config = {}) {
    try {
      const response = await api.patch(url, data, config);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 上传文件
  async upload(url, file, config = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

// 导出基础实例和方法
export { api as default, api };
export * from './modules';