import http from './http';

export async function register(username, password) {
  await http.post('/auth/register', { username, password });
}

export async function login(username, password) {
  const { data } = await http.post('/auth/login', { username, password });
  return data; // { token, user }
}