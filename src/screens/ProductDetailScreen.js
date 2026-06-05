// src/screens/ProductDetailScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; // mantemos apenas para fallback de fetch se necessário
import { getProductById } from '../services/productService';
import { useProductContext } from '../context/ProductContext'; // ✅ contexto
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const { products, updateProduct, removeProduct } = useProductContext(); // ✅ usa contexto

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ✅ Busca primeiro no contexto, depois na API
  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Procura no estado local
      const localProduct = products.find(p => p.id === productId);
      if (localProduct) {
        setProduct(localProduct);
        return; // já temos o produto atualizado
      }
      // Fallback: busca da API
      const apiProduct = await getProductById(productId);
      setProduct(apiProduct);
    } catch (err) {
      setError(err.userMessage || 'Não foi possível carregar o produto.');
    } finally {
      setIsLoading(false);
    }
  }, [productId, products]);

  // ✅ useFocusEffect apenas para o caso de o produto não estar no contexto
  useFocusEffect(
    useCallback(() => {
      fetchProduct();
    }, [fetchProduct])
  );

  function handleDeletePress() {
    Alert.alert(
      'Excluir produto',
      `Tem certeza que deseja excluir "${product.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: confirmDelete },
      ]
    );
  }

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await removeProduct(product.id); // ✅ usa removeProduct do contexto
      Alert.alert('Produto excluído', 'O produto foi removido com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erro', err.userMessage || 'Não foi possível excluir o produto.');
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) return <LoadingSpinner message="Carregando produto..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProduct} />;
  if (!product) return null;

  const images = product.images?.length > 0 ? product.images : [product.thumbnail];
  const stockColor = product.stock > 20 ? colors.success : product.stock > 5 ? colors.warning : colors.danger;
  const discountedPrice = product.discountPercentage > 0
    ? product.price * (1 - product.discountPercentage / 100) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Galeria */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
          >
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.image} resizeMode="contain" />
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentImageIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Categoria e rating */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.ratingText}>{product.rating?.toFixed(1)}</Text>
            </View>
          </View>

          <Text style={styles.title}>{product.title}</Text>
          {product.brand && <Text style={styles.brand}>por {product.brand}</Text>}

          {/* Preço */}
          <View style={styles.priceBlock}>
            <Text style={styles.price}>
              ${discountedPrice ? discountedPrice.toFixed(2) : product.price.toFixed(2)}
            </Text>
            {discountedPrice && (
              <View style={styles.discountRow}>
                <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{Math.round(product.discountPercentage)}% OFF</Text>
                </View>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Estoque</Text>
              <Text style={[styles.statValue, { color: stockColor }]}>{product.stock} un.</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Qtd. mínima</Text>
              <Text style={styles.statValue}>{product.minimumOrderQuantity ?? '—'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avaliações</Text>
              <Text style={styles.statValue}>{product.reviews?.length ?? 0}</Text>
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Informações */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações</Text>
            {[
              { label: 'SKU', value: product.sku },
              { label: 'Garantia', value: product.warrantyInformation },
              { label: 'Entrega', value: product.shippingInformation },
              { label: 'Devoluções', value: product.returnPolicy },
              { label: 'Disponibilidade', value: product.availabilityStatus },
            ].filter((r) => r.value).map((row) => (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* Avaliações */}
          {product.reviews?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Avaliações recentes</Text>
              {product.reviews.slice(0, 3).map((review, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                    <Text style={styles.reviewStars}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </Text>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ações */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('ProductForm', { product })} // produto já atualizado do contexto
          activeOpacity={0.85}
        >
          <Text style={styles.editButtonText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
          onPress={handleDeletePress}
          disabled={isDeleting}
          activeOpacity={0.85}
        >
          {isDeleting
            ? <ActivityIndicator color={colors.danger} size="small" />
            : <Text style={styles.deleteButtonText}>🗑️ Excluir</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// styles mantidos iguais
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  imageContainer: { backgroundColor: colors.surface },
  image: { width, height: 280, backgroundColor: colors.surfaceAlt },
  imageDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent, width: 16 },
  content: { padding: 20, gap: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: {
    backgroundColor: colors.accentLight, borderWidth: 1, borderColor: colors.accent,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  categoryText: { color: colors.accentDark, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { color: colors.star, fontSize: 16 },
  ratingText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', lineHeight: 30 },
  brand: { color: colors.textMuted, fontSize: 14 },
  priceBlock: { gap: 4 },
  price: { color: colors.success, fontSize: 30, fontWeight: '800' },
  discountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  originalPrice: { color: colors.textMuted, fontSize: 16, textDecorationLine: 'line-through' },
  discountBadge: {
    backgroundColor: colors.dangerLight, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  discountText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  statValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  section: { gap: 10 },
  sectionTitle: {
    color: colors.textMuted, fontSize: 13, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: {
    color: colors.textSecondary, fontSize: 13, fontWeight: '500',
    flex: 1, textAlign: 'right', marginLeft: 8,
  },
  reviewCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14, gap: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewerName: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  reviewStars: { color: colors.star, fontSize: 12 },
  reviewComment: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  actions: {
    flexDirection: 'row', padding: 16, gap: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  editButton: {
    flex: 1, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
  editButtonText: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  deleteButton: {
    flex: 1, backgroundColor: colors.dangerLight,
    borderWidth: 1, borderColor: colors.danger,
    borderRadius: 12, paddingVertical: 15, alignItems: 'center',
  },
  deleteButtonText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  buttonDisabled: { opacity: 0.6 },
});