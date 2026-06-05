// src/screens/ProductListScreen.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useProductContext } from '../context/ProductContext'; // ✅ contexto
import { getCategories } from '../services/productService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { colors } from '../theme';

export default function ProductListScreen({ navigation }) {
  const { user, logout } = useAuth();
  const {
    products, isLoading, isRefreshing, isLoadingMore, error,
    total, loadInitial, refresh, loadMore, search, filterByCategory,
  } = useProductContext(); // ✅ usa contexto

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const searchTimeout = useRef(null);

  // Categorias carregadas uma vez
  useEffect(() => {
    loadCategoriesList();
  }, []);

  // Carrega produtos na primeira montagem (sem refetch automático)
  useEffect(() => {
    loadInitial();
  }, []);

  async function loadCategoriesList() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch { }
  }

  function handleSearchChange(text) {
    setSearchText(text);
    setSelectedCategory('');
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { search(text); }, 450);
  }

  function handleCategorySelect(slug) {
    setSelectedCategory(slug);
    setSearchText('');
    setShowCategoryModal(false);
    filterByCategory(slug);
  }

  function handleClearFilters() {
    setSelectedCategory('');
    setSearchText('');
    loadInitial();
  }

  async function handleLogout() {
    try { await logout(); } catch { }
  }

  const renderItem = useCallback(
    ({ item }) => (
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      />
    ),
    [navigation]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  function ListFooter() {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.footerLoaderText}>Carregando mais produtos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.firstName || 'usuário'} 👋</Text>
          <Text style={styles.headerTitle}>MiniStock</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('ProductForm')}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ Novo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de busca */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produto..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, selectedCategory && styles.filterButtonActive]}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Chip de categoria ativa */}
      {selectedCategory ? (
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{selectedCategory}</Text>
            <TouchableOpacity onPress={handleClearFilters}>
              <Text style={styles.chipClose}> ✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.totalCount}>{total} produtos</Text>
        </View>
      ) : (
        <Text style={styles.totalCount}>{total} produtos no catálogo</Text>
      )}

      {/* Conteúdo */}
      {isLoading ? (
        <LoadingSpinner message="Carregando produtos..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => loadInitial(searchText, selectedCategory)} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={refresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={<ListFooter />}
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="Nenhum produto encontrado"
              subtitle="Tente outro termo ou limpe os filtros."
            />
          }
        />
      )}

      {/* Modal de categorias */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filtrar por categoria</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.categoryItem, !selectedCategory && styles.categoryItemActive]}
                onPress={handleClearFilters}
              >
                <Text style={styles.categoryItemText}>Todas as categorias</Text>
              </TouchableOpacity>
              {categories.map((slug) => (
                <TouchableOpacity
                  key={slug}
                  style={[styles.categoryItem, selectedCategory === slug && styles.categoryItemActive]}
                  onPress={() => handleCategorySelect(slug)}
                >
                  <Text style={styles.categoryItemText}>{slug}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// (os estilos permanecem exatamente os mesmos, não os repeti por brevidade)
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  greeting: { color: colors.textMuted, fontSize: 13 },
  headerTitle: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
  },
  addButtonText: { color: colors.textOnAccent, fontWeight: '800', fontSize: 14 },
  logoutButton: {
    backgroundColor: colors.surface,
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  logoutIcon: { fontSize: 18 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 13 },
  filterButton: {
    backgroundColor: colors.surface, width: 48, height: 48,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  filterButtonActive: { borderColor: colors.accent, backgroundColor: colors.accentLight },
  filterIcon: { fontSize: 20 },
  chipRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 8, gap: 10,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderWidth: 1, borderColor: colors.accent,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  chipText: { color: colors.accentDark, fontSize: 13, fontWeight: '600' },
  chipClose: { color: colors.accentDark, fontSize: 14, fontWeight: '700' },
  totalCount: { color: colors.textMuted, fontSize: 12, paddingHorizontal: 20, marginBottom: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  footerLoader: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, gap: 10,
  },
  footerLoaderText: { color: colors.textMuted, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '70%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  categoryItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 4 },
  categoryItemActive: { backgroundColor: colors.accentLight },
  categoryItemText: { color: colors.textSecondary, fontSize: 15 },
});