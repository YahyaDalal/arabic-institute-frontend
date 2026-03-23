import client from './client';

export const register = (data) => client.post('/api/auth/register/', data);
export const login = (data) => client.post('/api/auth/login/', data);
export const getProfile = () => client.get('/api/auth/profile/');
export const updateProfile = (data) => client.patch('/api/auth/profile/', data);
export const requestPasswordReset = (email) =>
  client.post('/api/auth/password-reset/', { email });
export const confirmPasswordReset = (token, password) =>
  client.post('/api/auth/password-reset/confirm/', { token, password });