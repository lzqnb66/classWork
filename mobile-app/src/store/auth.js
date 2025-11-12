import { defineStore } from 'pinia';
import { login as apiLogin, register as apiRegister } from '../api/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),
  getters: { isAuthed: (s) => !!s.token },
  actions: {
    async register(username, password) {
      await apiRegister(username, password);
    },
    async login(username, password) {
      const data = await apiLogin(username, password);
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
    }
  }
});