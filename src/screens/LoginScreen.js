// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Limpa erro global ao desmontar
  useEffect(() => () => clearError(), []);

  // ─── Validação local dos campos ──────────────────────────────────────────────
  function validate() {
    const errors = {};
    if (!username.trim()) errors.username = 'Informe o usuário';
    if (!password.trim()) errors.password = 'Informe a senha';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────
  async function handleLogin() {
    if (!validate()) return;
    clearError();
    try {
      await login(username.trim(), password);
    } catch {
      // Erro já tratado no AuthContext
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>📦</Text>
            </View>
            <Text style={styles.appName}>MiniStock</Text>
            <Text style={styles.tagline}>Gestão de estoque na palma da mão</Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Entrar na conta</Text>

            {/* Erro global da API */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Campo usuário */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Usuário</Text>
              <TextInput
                style={[styles.input, fieldErrors.username && styles.inputError]}
                placeholder="ex: emilys"
                placeholderTextColor="#475569"
                value={username}
                onChangeText={(v) => {
                  setUsername(v);
                  if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: null }));
                }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {fieldErrors.username ? (
                <Text style={styles.fieldError}>{fieldErrors.username}</Text>
              ) : null}
            </View>

            {/* Campo senha */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    fieldErrors.password && styles.inputError,
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: null }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.password ? (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              ) : null}
            </View>

            {/* Credenciais de teste */}
            <TouchableOpacity
              style={styles.fillDemo}
              onPress={() => { setUsername('emilys'); setPassword('emilyspass'); }}
            >
              <Text style={styles.fillDemoText}>
                🔑 Usar credenciais de teste
              </Text>
            </TouchableOpacity>

            {/* Botão de login */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoEmoji: { fontSize: 38 },
  appName: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 6,
  },
  form: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 16,
  },
  formTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '500',
  },
  fieldGroup: { gap: 6 },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  fieldError: {
    color: '#f87171',
    fontSize: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  eyeButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#334155',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyeIcon: { fontSize: 18 },
  fillDemo: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  fillDemoText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
});
