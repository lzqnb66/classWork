import { defineStore } from 'pinia';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api' });

export const useAuthStore = defineStore('admin-auth', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  }),
  getters: { isAuthed: (s) => !!s.token },
  actions: {
    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password });
      if (!data.user?.is_admin) throw new Error('该账号不是管理员');
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('admin_token', this.token);
      localStorage.setItem('admin_user', JSON.stringify(this.user));
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    },
    api() {
      const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api' });
      if (this.token) client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      return client;
    }
  }
});