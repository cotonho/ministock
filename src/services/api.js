// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const TOKEN_KEY = '@ministock:token';
const USER_KEY  = '@ministock:user';

const api = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptor de REQUEST ───────────────────────────────────────────────────
// Injeta o token Bearer automaticamente em todas as requisições
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[API] Erro ao ler token:', error.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Interceptor de RESPONSE ──────────────────────────────────────────────────
// Trata erros globais conforme exigido pelo enunciado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Sem conexão ou timeout
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Sem conexão, tente novamente.';
      error.type = 'TIMEOUT';
      return Promise.reject(error);
    }
    if (!error.response) {
      error.userMessage = 'Sem conexão, tente novamente.';
      error.type = 'NETWORK';
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401) {
      // Limpa sessão e emite evento para o AuthContext redirecionar ao login
      try {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        DeviceEventEmitter.emit('UNAUTHORIZED');
      } catch { /* falha silenciosa */ }
      error.userMessage = 'Sessão expirada. Faça login novamente.';
      error.type = 'UNAUTHORIZED';
    } else if (status === 404) {
      error.userMessage = 'Recurso não encontrado.';
      error.type = 'NOT_FOUND';
    } else if (status >= 500) {
      error.userMessage = 'Erro no servidor, tente novamente.';
      error.type = 'SERVER_ERROR';
    } else {
      error.userMessage = error.response?.data?.message || 'Ocorreu um erro inesperado.';
      error.type = 'UNKNOWN';
    }

    return Promise.reject(error);
  }
);

export default api;