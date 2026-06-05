// src/components/ErrorMessage.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Algo deu errado</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 12, backgroundColor: colors.bg,
  },
  icon: { fontSize: 48 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  message: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  button: {
    marginTop: 8, backgroundColor: colors.accent,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  buttonText: { color: colors.textOnAccent, fontWeight: '700', fontSize: 15 },
});
