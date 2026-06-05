// src/screens/ProductFormScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductContext } from '../context/ProductContext'; // ✅ contexto
import { getCategories } from '../services/productService';
import { colors } from '../theme';

function buildInitialForm(product) {
  if (!product) return { title: '', price: '', stock: '', category: '', description: '', brand: '', discountPercentage: '' };
  return {
    title: product.title || '',
    price: String(product.price ?? ''),
    stock: String(product.stock ?? ''),
    category: product.category || '',
    description: product.description || '',
    brand: product.brand || '',
    discountPercentage: String(product.discountPercentage ?? ''),
  };
}

function Field({ form, errors, setField, isSubmitting, label, fieldKey, placeholder, keyboardType = 'default', multiline = false, required = false }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>
        {label}{required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput, errors[fieldKey] && styles.inputError]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={form[fieldKey]}
        onChangeText={(v) => setField(fieldKey, v)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={!isSubmitting}
      />
      {errors[fieldKey] && <Text style={styles.fieldError}>{errors[fieldKey]}</Text>}
    </View>
  );
}

export default function ProductFormScreen({ route, navigation }) {
  const product = route.params?.product ?? null;
  const isEditing = !!product;

  const [form, setForm] = useState(buildInitialForm(product));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // ✅ funções do contexto
  const { createProduct, updateProduct } = useProductContext();

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    try { setCategories(await getCategories()); } catch { }
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Título é obrigatório';
    else if (form.title.trim().length < 3) e.title = 'Título muito curto (mín. 3 caracteres)';
    if (!form.price.trim()) e.price = 'Preço é obrigatório';
    else if (isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Preço deve ser um número positivo';
    if (!form.stock.trim()) e.stock = 'Estoque é obrigatório';
    else if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Estoque deve ser um inteiro não negativo';
    if (!form.category.trim()) e.category = 'Categoria é obrigatória';
    if (!form.description.trim()) e.description = 'Descrição é obrigatória';
    if (form.discountPercentage && (isNaN(Number(form.discountPercentage)) ||
      Number(form.discountPercentage) < 0 || Number(form.discountPercentage) > 100))
      e.discountPercentage = 'Desconto deve ser entre 0 e 100';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsSubmitting(true);
    const payload = {
      title: form.title.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category.trim(),
      description: form.description.trim(),
      brand: form.brand.trim() || undefined,
      discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : 0,
    };
    try {
      if (isEditing) {
        await updateProduct(product.id, payload); // ✅ atualiza estado global
      } else {
        await createProduct(payload);             // ✅ adiciona no estado global
      }
      Alert.alert('Sucesso', isEditing ? 'Produto atualizado!' : 'Produto cadastrado!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erro', err.userMessage || 'Não foi possível salvar o produto.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Informações básicas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Informações básicas</Text>
            <Field form={form} errors={errors} setField={setField} isSubmitting={isSubmitting}
              label="Título do produto" fieldKey="title" placeholder="ex: Tênis Nike Air Max" required />
            <Field form={form} errors={errors} setField={setField} isSubmitting={isSubmitting}
              label="Marca" fieldKey="brand" placeholder="ex: Nike" />
            <Field form={form} errors={errors} setField={setField} isSubmitting={isSubmitting}
              label="Descrição" fieldKey="description" placeholder="Descreva o produto..." multiline required />
          </View>

          {/* Preço e estoque */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Preço e estoque</Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Preço (USD) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  placeholder="0.00" placeholderTextColor={colors.textMuted}
                  value={form.price} onChangeText={(v) => setField('price', v)}
                  keyboardType="decimal-pad" editable={!isSubmitting}
                />
                {errors.price && <Text style={styles.fieldError}>{errors.price}</Text>}
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Estoque (un.) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.stock && styles.inputError]}
                  placeholder="0" placeholderTextColor={colors.textMuted}
                  value={form.stock} onChangeText={(v) => setField('stock', v)}
                  keyboardType="number-pad" editable={!isSubmitting}
                />
                {errors.stock && <Text style={styles.fieldError}>{errors.stock}</Text>}
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Desconto (%)</Text>
              <TextInput
                style={[styles.input, errors.discountPercentage && styles.inputError]}
                placeholder="0" placeholderTextColor={colors.textMuted}
                value={form.discountPercentage} onChangeText={(v) => setField('discountPercentage', v)}
                keyboardType="decimal-pad" editable={!isSubmitting}
              />
              {errors.discountPercentage && <Text style={styles.fieldError}>{errors.discountPercentage}</Text>}
            </View>
          </View>

          {/* Categoria */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏷️ Categoria</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Categoria <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.category && styles.inputError]}
                placeholder="ex: smartphones" placeholderTextColor={colors.textMuted}
                value={form.category}
                onChangeText={(v) => {
                  setField('category', v);
                  setShowCategoryPicker(v.length > 0 && categories.length > 0);
                }}
                editable={!isSubmitting}
              />
              {errors.category && <Text style={styles.fieldError}>{errors.category}</Text>}
            </View>
            {showCategoryPicker && (
              <View style={styles.suggestions}>
                {categories
                  .filter((c) => {
                    const slug = typeof c === 'string' ? c : c.slug;
                    return slug.toLowerCase().includes(form.category.toLowerCase());
                  })
                  .slice(0, 5)
                  .map((cat) => {
                    const slug = typeof cat === 'string' ? cat : cat.slug;
                    const name = typeof cat === 'string' ? cat : cat.name;
                    return (
                      <TouchableOpacity
                        key={slug} style={styles.suggestionItem}
                        onPress={() => { setField('category', slug); setShowCategoryPicker(false); }}
                      >
                        <Text style={styles.suggestionText}>{name}</Text>
                        <Text style={styles.suggestionSlug}>{slug}</Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
            onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.85}
          >
            {isSubmitting
              ? <ActivityIndicator color={colors.textOnAccent} />
              : <Text style={styles.submitText}>{isEditing ? '💾 Salvar alterações' : '✅ Cadastrar produto'}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// (os estilos permanecem os mesmos, não repeti por brevidade)
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  section: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 18, gap: 14,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    color: colors.textSecondary, fontSize: 13, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
  fieldGroup: { gap: 6 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  required: { color: colors.danger },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    color: colors.textPrimary, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  multilineInput: { height: 100, paddingTop: 13 },
  inputError: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: 12 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1, gap: 6 },
  suggestions: {
    backgroundColor: colors.surfaceAlt, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  suggestionText: { color: colors.textPrimary, fontSize: 14 },
  suggestionSlug: { color: colors.textMuted, fontSize: 12 },
  submitButton: {
    backgroundColor: colors.accent, borderRadius: 14,
    paddingVertical: 17, alignItems: 'center', marginTop: 4,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.textOnAccent, fontWeight: '800', fontSize: 16 },
});