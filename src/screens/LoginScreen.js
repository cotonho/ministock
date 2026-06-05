// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => () => clearError(), []);

  function validate() {
    const errors = {};
    if (!username.trim()) errors.username = 'Informe o usuário';
    if (!password.trim()) errors.password = 'Informe a senha';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

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
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
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
                placeholderTextColor={colors.textMuted}
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
                  style={[styles.input, styles.passwordInput, fieldErrors.password && styles.inputError]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
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
              <Text style={styles.fillDemoText}>🔑 Usar credenciais de teste</Text>
            </TouchableOpacity>

            {/* Botão de login */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textOnAccent} />
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
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 80, height: 80,
    backgroundColor: colors.accentLight,
    borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  logoEmoji: { fontSize: 38 },
  appName: { color: colors.textPrimary, fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: colors.textMuted, fontSize: 14, marginTop: 6 },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: colors.border,
    gap: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  formTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.danger,
  },
  errorBannerText: { color: colors.danger, fontSize: 13, fontWeight: '500' },
  fieldGroup: { gap: 6 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    color: colors.textPrimary, fontSize: 15,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  inputError: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: 12 },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  eyeButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderLeftWidth: 0, borderColor: colors.border,
    borderTopRightRadius: 12, borderBottomRightRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  eyeIcon: { fontSize: 18 },
  fillDemo: { alignSelf: 'center', paddingVertical: 6 },
  fillDemoText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textOnAccent, fontSize: 16, fontWeight: '800' },
});
