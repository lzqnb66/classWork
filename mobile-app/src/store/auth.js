import { defineStore } from 'pinia';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api' });

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),
  getters: {
    isAuthed: (s) => !!s.token,
  },
  actions: {
    async register(username, password) {
      await api.post('/auth/register', { username, password });
    },
    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password });
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    api() {
      // attach bearer
      const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api' });
      if (this.token) client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      return client;
    }
  }
});