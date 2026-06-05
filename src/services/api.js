import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 10000,
});

// Interceptor de REQUEST → injeta token automaticamente
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de RESPONSE → trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) { /* redirecionar para login */ }
    if (error.response?.status === 404) { /* produto não encontrado */ }
    if (error.response?.status >= 500)  { /* erro no servidor */ }
    if (error.code === 'ECONNABORTED')  { /* timeout */ }
    return Promise.reject(error);
  }
);

export default api;