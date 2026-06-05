// src/screens/ProductFormScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createProduct, updateProduct, getCategories } from '../services/productService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildInitialForm(product) {
  if (!product) {
    return { title: '', price: '', stock: '', category: '', description: '', brand: '', discountPercentage: '' };
  }
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

export default function ProductFormScreen({ route, navigation }) {
  const product = route.params?.product ?? null;
  const isEditing = !!product;

  const [form, setForm] = useState(buildInitialForm(product));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      // Sem categorias para sugerir — usuário digita manualmente
    }
  }

  // ─── Atualiza campo do formulário ────────────────────────────────────────────
  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  }

  // ─── Validação ────────────────────────────────────────────────────────────────
  function validate() {
    const newErrors = {};

    if (!form.title.trim()) newErrors.title = 'Título é obrigatório';
    else if (form.title.trim().length < 3) newErrors.title = 'Título muito curto (mín. 3 caracteres)';

    if (!form.price.trim()) newErrors.price = 'Preço é obrigatório';
    else if (isNaN(Number(form.price)) || Number(form.price) <= 0)
      newErrors.price = 'Preço deve ser um número positivo';

    if (!form.stock.trim()) newErrors.stock = 'Estoque é obrigatório';
    else if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)
      newErrors.stock = 'Estoque deve ser um número inteiro não negativo';

    if (!form.category.trim()) newErrors.category = 'Categoria é obrigatória';

    if (!form.description.trim()) newErrors.description = 'Descrição é obrigatória';

    if (form.discountPercentage && (isNaN(Number(form.discountPercentage)) ||
      Number(form.discountPercentage) < 0 || Number(form.discountPercentage) > 100))
      newErrors.discountPercentage = 'Desconto deve ser entre 0 e 100';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────
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
        await updateProduct(product.id, payload);
        Alert.alert('Sucesso', 'Produto atualizado com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createProduct(payload);
        Alert.alert('Sucesso', 'Produto cadastrado com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Erro', err.userMessage || 'Não foi possível salvar o produto.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Campo genérico ──────────────────────────────────────────────────────────
  function Field({ label, fieldKey, placeholder, keyboardType = 'default', multiline = false, required = false }) {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            errors[fieldKey] && styles.inputError,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#475569"
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
          {/* Seção: Informações básicas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Informações básicas</Text>

            <Field
              label="Título do produto"
              fieldKey="title"
              placeholder="ex: Tênis Nike Air Max"
              required
            />
            <Field
              label="Marca"
              fieldKey="brand"
              placeholder="ex: Nike"
            />
            <Field
              label="Descrição"
              fieldKey="description"
              placeholder="Descreva o produto..."
              multiline
              required
            />
          </View>

          {/* Seção: Preço e estoque */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Preço e estoque</Text>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Preço (USD) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                  value={form.price}
                  onChangeText={(v) => setField('price', v)}
                  keyboardType="decimal-pad"
                  editable={!isSubmitting}
                />
                {errors.price && <Text style={styles.fieldError}>{errors.price}</Text>}
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>Estoque (un.) <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.stock && styles.inputError]}
                  placeholder="0"
                  placeholderTextColor="#475569"
                  value={form.stock}
                  onChangeText={(v) => setField('stock', v)}
                  keyboardType="number-pad"
                  editable={!isSubmitting}
                />
                {errors.stock && <Text style={styles.fieldError}>{errors.stock}</Text>}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Desconto (%)</Text>
              <TextInput
                style={[styles.input, errors.discountPercentage && styles.inputError]}
                placeholder="0"
                placeholderTextColor="#475569"
                value={form.discountPercentage}
                onChangeText={(v) => setField('discountPercentage', v)}
                keyboardType="decimal-pad"
                editable={!isSubmitting}
              />
              {errors.discountPercentage && (
                <Text style={styles.fieldError}>{errors.discountPercentage}</Text>
              )}
            </View>
          </View>

          {/* Seção: Categoria */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏷️ Categoria</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Categoria <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.category && styles.inputError]}
                placeholder="ex: smartphones"
                placeholderTextColor="#475569"
                value={form.category}
                onChangeText={(v) => {
                  setField('category', v);
                  setShowCategoryPicker(v.length > 0 && categories.length > 0);
                }}
                editable={!isSubmitting}
              />
              {errors.category && <Text style={styles.fieldError}>{errors.category}</Text>}
            </View>

            {/* Sugestões de categoria */}
            {showCategoryPicker && (
              <View style={styles.suggestions}>
                {categories
                  .filter((c) =>
                    c.name.toLowerCase().includes(form.category.toLowerCase()) ||
                    c.slug.toLowerCase().includes(form.category.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((cat) => (
                    <TouchableOpacity
                      key={cat.slug}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setField('category', cat.slug);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={styles.suggestionText}>{cat.name}</Text>
                      <Text style={styles.suggestionSlug}>{cat.slug}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>

          {/* Botão de submit */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.submitText}>
                {isEditing ? '💾 Salvar alterações' : '✅ Cadastrar produto'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  flex: { flex: 1 },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  fieldGroup: { gap: 6 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  required: { color: '#f87171' },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  multilineInput: { height: 100, paddingTop: 13 },
  inputError: { borderColor: '#ef4444' },
  fieldError: { color: '#f87171', fontSize: 12 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1, gap: 6 },
  suggestions: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  suggestionText: { color: '#f8fafc', fontSize: 14 },
  suggestionSlug: { color: '#475569', fontSize: 12 },
  submitButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#0f172a', fontWeight: '800', fontSize: 16 },
});
