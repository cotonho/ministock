// src/screens/ProductDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProductById, deleteProduct } from '../services/productService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ─── Carga do produto ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProduct();
  }, [productId]);

  async function fetchProduct() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProductById(productId);
      setProduct(data);
    } catch (err) {
      setError(err.userMessage || 'Não foi possível carregar o produto.');
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Exclusão com confirmação ────────────────────────────────────────────────
  function handleDeletePress() {
    Alert.alert(
      'Excluir produto',
      `Tem certeza que deseja excluir "${product.title}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  }

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      Alert.alert('Produto excluído', 'O produto foi removido com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Erro', err.userMessage || 'Não foi possível excluir o produto.');
    } finally {
      setIsDeleting(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (isLoading) return <LoadingSpinner message="Carregando produto..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProduct} />;
  if (!product) return null;

  const images = product.images?.length > 0 ? product.images : [product.thumbnail];
  const stockColor =
    product.stock > 20 ? '#4ade80' : product.stock > 5 ? '#facc15' : '#f87171';
  const discountedPrice =
    product.discountPercentage > 0
      ? product.price * (1 - product.discountPercentage / 100)
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Galeria de imagens */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.image} resizeMode="contain" />
            ))}
          </ScrollView>

          {/* Indicadores de imagem */}
          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === currentImageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Conteúdo */}
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

          {/* Título */}
          <Text style={styles.title}>{product.title}</Text>

          {/* Marca */}
          {product.brand && (
            <Text style={styles.brand}>por {product.brand}</Text>
          )}

          {/* Preço */}
          <View style={styles.priceBlock}>
            <Text style={styles.price}>
              ${discountedPrice ? discountedPrice.toFixed(2) : product.price.toFixed(2)}
            </Text>
            {discountedPrice && (
              <View style={styles.discountRow}>
                <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{Math.round(product.discountPercentage)}% OFF
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Estatísticas */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Estoque</Text>
              <Text style={[styles.statValue, { color: stockColor }]}>
                {product.stock} un.
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Vendas</Text>
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

          {/* Informações adicionais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações</Text>
            {[
              { label: 'SKU', value: product.sku },
              { label: 'Garantia', value: product.warrantyInformation },
              { label: 'Entrega', value: product.shippingInformation },
              { label: 'Devoluções', value: product.returnPolicy },
              { label: 'Disponibilidade', value: product.availabilityStatus },
            ]
              .filter((row) => row.value)
              .map((row) => (
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
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </Text>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ações fixas na parte inferior */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('ProductForm', { product })}
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
          {isDeleting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.deleteButtonText}>🗑️ Excluir</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  imageContainer: {
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  image: {
    width,
    height: 280,
    backgroundColor: '#1e293b',
  },
  imageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#475569',
  },
  dotActive: { backgroundColor: '#38bdf8', width: 16 },
  content: { padding: 20, gap: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: {
    backgroundColor: '#0c2a3f',
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryText: { color: '#38bdf8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { color: '#facc15', fontSize: 16 },
  ratingText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '800', lineHeight: 30 },
  brand: { color: '#64748b', fontSize: 14 },
  priceBlock: { gap: 4 },
  price: { color: '#4ade80', fontSize: 30, fontWeight: '800' },
  discountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  originalPrice: { color: '#64748b', fontSize: 16, textDecorationLine: 'line-through' },
  discountBadge: {
    backgroundColor: '#7f1d1d',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  discountText: { color: '#fca5a5', fontSize: 12, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  statValue: { color: '#f8fafc', fontSize: 16, fontWeight: '800' },
  section: { gap: 10 },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  description: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  infoLabel: { color: '#64748b', fontSize: 13 },
  infoValue: { color: '#cbd5e1', fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 8 },
  reviewCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewerName: { color: '#f8fafc', fontWeight: '700', fontSize: 13 },
  reviewStars: { color: '#facc15', fontSize: 12 },
  reviewComment: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  editButtonText: { color: '#f8fafc', fontWeight: '700', fontSize: 15 },
  deleteButton: {
    flex: 1,
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#fca5a5', fontWeight: '700', fontSize: 15 },
  buttonDisabled: { opacity: 0.6 },
});
