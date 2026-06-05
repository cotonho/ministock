// src/components/ProductCard.js
import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

function ProductCard({ product, onPress }) {
  const stock = product.stock;
  const stockColor = stock > 20 ? colors.success : stock > 5 ? colors.warning : colors.danger;
  const stockBg    = stock > 20 ? colors.successLight : stock > 5 ? colors.warningLight : colors.dangerLight;

  const discountedPrice = product.discountPercentage > 0
    ? product.price * (1 - product.discountPercentage / 100) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: product.thumbnail }} style={styles.image} resizeMode="cover" />

      {product.discountPercentage > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{Math.round(product.discountPercentage)}%</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>
              ${discountedPrice ? discountedPrice.toFixed(2) : product.price.toFixed(2)}
            </Text>
            {discountedPrice && (
              <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>
            )}
          </View>
          <View style={[styles.stockBadge, { backgroundColor: stockBg }]}>
            <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
            <Text style={[styles.stockText, { color: stockColor }]}>{stock} un.</Text>
          </View>
        </View>

        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingText}>
            {product.rating?.toFixed(1)} · {product.brand || product.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ProductCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: { width: '100%', height: 160, backgroundColor: colors.surfaceAlt },
  discountBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: colors.danger, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  discountText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  content: { padding: 14, gap: 4 },
  category: {
    color: colors.accentDark, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', lineHeight: 21, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { color: colors.success, fontSize: 18, fontWeight: '800' },
  originalPrice: { color: colors.textMuted, fontSize: 12, textDecorationLine: 'line-through' },
  stockBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5,
  },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 12, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  star: { color: colors.star, fontSize: 13 },
  ratingText: { color: colors.textMuted, fontSize: 12 },
});
