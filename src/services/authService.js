// src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const TOKEN_KEY = '@ministock:token';
const USER_KEY  = '@ministock:user'; // CORRIGIDO: era '@ministack:user' (typo)

/**
 * Autentica o usuário e persiste o token no AsyncStorage.
 * A DummyJSON retorna "accessToken" (não "token").
 */
export async function login(username, password) {
  const response = await api.post('/auth/login', {
    username,
    password,
    expiresInMins: 60,
  });

  // campo correto da API é "accessToken"
  const { accessToken, refreshToken, ...user } = response.data;

  await AsyncStorage.multiSet([
    [TOKEN_KEY, accessToken],
    [USER_KEY,  JSON.stringify(user)],
  ]);

  return { token: accessToken, user };
}

export async function logout() {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.warn('[authService] Erro ao limpar AsyncStorage:', error.message);
    throw error;
  }
}

export async function getStoredToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getStoredUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}