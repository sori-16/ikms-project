// Created by: Soreti (Team Leader) - Demo Implementation
// Auth utility functions for managing JWT tokens and user sessions

export const setToken = (token) => {
  localStorage.setItem('ikms_token', token);
};

export const getToken = () => {
  return localStorage.getItem('ikms_token');
};

export const removeToken = () => {
  localStorage.removeItem('ikms_token');
  localStorage.removeItem('ikms_user');
};

export const setUser = (user) => {
  localStorage.setItem('ikms_user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('ikms_user');
  return user ? JSON.parse(user) : null;
};

export const getUserRole = () => {
  const user = getUser();
  return user ? user.role : null;
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const logout = () => {
  removeToken();
  window.location.href = '/';
};

// Create axios instance with auth header
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
