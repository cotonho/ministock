// src/context/AuthContext.js
// Gerencia estado global de autenticação e expõe para toda a árvore de componentes
import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { login as loginService, logout as logoutService, getStoredToken, getStoredUser } from '../services/authService';

// ─── Estado inicial ───────────────────────────────────────────────────────────
const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // true enquanto lê AsyncStorage na inicialização
  error: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return {
        ...state,
        token: action.token,
        user: action.user,
        isAuthenticated: !!action.token,
        isLoading: false,
      };
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        token: action.token,
        user: action.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, error: action.error };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restaura sessão ao abrir o app
  useEffect(() => {
    async function restoreSession() {
      const token = await getStoredToken();
      const user = await getStoredUser();
      dispatch({ type: 'RESTORE_SESSION', token, user });
    }
    restoreSession();
  }, []);

  // Escuta o evento de não autorizado (emitido pelo interceptor ao receber 401)
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('UNAUTHORIZED', () => {
      dispatch({ type: 'LOGOUT' });
    });
    return () => subscription.remove();
  }, []);

  const login = useCallback(async (username, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { token, user } = await loginService(username, password);
      dispatch({ type: 'LOGIN_SUCCESS', token, user });
    } catch (error) {
      const message = error.userMessage || 'Usuário ou senha inválidos.';
      dispatch({ type: 'LOGIN_FAILURE', error: message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutService();
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}