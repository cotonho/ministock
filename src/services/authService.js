
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const TOKEN_KEY = '@ministock:token';
const USER_KEY = '@ministock:user';

/**
 * Autentica o usuário na API DummyJSON e persiste o token no AsyncStorage.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function login(username, password) {
  try {
    const response = await api.post('/auth/login', {
      username,
      password,
      expiresInMins: 60,
    });

    const { token, ...user } = response.data;

    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);

    return { token, user };
  } catch (error) {
    throw error;
  }
}

/**
 * Remove o token e dados do usuário do AsyncStorage (logout local).
 */
export async function logout() {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.warn('[authService] Erro ao limpar AsyncStorage:', error.message);
    throw error;
  }
}

/**
 * Lê o token salvo. Retorna null se não houver sessão.
 * @returns {Promise<string|null>}
 */
export async function getStoredToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Lê o usuário salvo. Retorna null se não houver sessão.
 * @returns {Promise<object|null>}
 */
export async function getStoredUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
