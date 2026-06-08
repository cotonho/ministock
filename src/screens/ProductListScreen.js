// src/screens/ProductListScreen.js
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal, ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useProductContext } from '../context/ProductContext';
import { getCategories } from '../services/productService';
import { colors } from '../theme';

export default function ProductListScreen({ navigation }) {
  const { user, logout } = useAuth();
  const {
    products,           // array completo no contexto (inclui itens adicionados/editados)
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    total,
    loadInitial,
    refresh: contextRefresh,
    loadMore: contextLoadMore,
    hasMore,
  } = useProductContext();

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Categorias carregadas uma vez
  useEffect(() => {
    loadCategoriesList();
  }, []);

  // Carrega produtos iniciais da API (sem filtros)
  useEffect(() => {
    loadInitial();
  }, []);

  async function loadCategoriesList() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch { }
  }

  // ─── FILTRO LOCAL ─────────────────────────────────────────────
  // Aplica pesquisa textual e categoria sobre o array em memória
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchText.trim()) {
      const lower = searchText.trim().toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower) ||
        p.brand?.toLowerCase().includes(lower)
      );
    }

    return result;
  }, [products, searchText, selectedCategory]);

  // ─── Handlers ─────────────────────────────────────────────────
  function handleSearchChange(text) {
    setSearchText(text);
    // Não chama API – apenas atualiza o estado local
  }

  function handleCategorySelect(slug) {
    setSelectedCategory(slug);
    setShowCategoryModal(false);
    // Não chama API – apenas atualiza o estado local
  }

  function handleClearFilters() {
    setSelectedCategory('');
    setSearchText('');
    // Opcional: recarregar a lista original da API se quiseres
    // loadInitial();
  }

  async function handleLogout() {
    try { await logout(); } catch { }
  }

  // Pull-to-refresh: limpa filtros e recarrega da API
  function handleRefresh() {
    setSearchText('');
    setSelectedCategory('');
    contextRefresh(); // refresh do contexto (vai buscar página 0 sem filtros)
  }

  // Paginação infinita: só quando não há filtros ativos
  function handleLoadMore() {
    if (searchText || selectedCategory) return; // não carrega mais com filtro local
    contextLoadMore();
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
            <Text>Sair</Text>
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
          <Text style={styles.totalCount}>{filteredProducts.length} de {products.length} produtos</Text>
        </View>
      ) : (
        <Text style={styles.totalCount}>{products.length} produtos carregados</Text>
      )}

      {/* Conteúdo */}
      {isLoading ? (
        <LoadingSpinner message="Carregando produtos..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => loadInitial()} />
      ) : (
        <FlatList
          data={filteredProducts}   // usa a lista filtrada localmente
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}    // refresh reseta filtros
          onEndReached={handleLoadMore}
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

// Estilos (mantidos exatamente como antes)
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