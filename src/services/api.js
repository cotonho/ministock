import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── INTERCEPTOR DE REQUEST ───────────────────────────────────────────────────
// Injeta o token Bearer automaticamente em todas as requisições autenticadas
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@ministock:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[API] Erro ao ler token do AsyncStorage:', error.message);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── INTERCEPTOR DE RESPONSE ──────────────────────────────────────────────────
// Trata erros globais: 401, 404, 5xx e timeout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'A requisição demorou muito. Verifique sua conexão.';
      error.type = 'TIMEOUT';
      return Promise.reject(error);
    }

    if (!error.response) {
      error.userMessage = 'Sem conexão com o servidor. Tente novamente.';
      error.type = 'NETWORK';
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401) {
      error.userMessage = 'Sessão expirada. Faça login novamente.';
      error.type = 'UNAUTHORIZED';
      // O AuthContext observa esse tipo para redirecionar ao login
    } else if (status === 404) {
      error.userMessage = 'Recurso não encontrado.';
      error.type = 'NOT_FOUND';
    } else if (status >= 500) {
      error.userMessage = 'Erro interno do servidor. Tente mais tarde.';
      error.type = 'SERVER_ERROR';
    } else {
      error.userMessage = error.response?.data?.message || 'Ocorreu um erro inesperado.';
      error.type = 'UNKNOWN';
    }

    return Promise.reject(error);
  }
);

export default api;
