import http from './http';

export async function getProfile() {
  const { data } = await http.get('/profile');
  return data;
}

export async function updateProfile(payload) {
  const { data } = await http.put('/profile', payload);
  return data;
}

export async function uploadAvatar(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await http.post('/profile/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function changePassword(payload) {
  const { data } = await http.post('/profile/change-password', payload);
  return data;
}