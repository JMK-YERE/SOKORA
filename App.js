import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

const categories = ['Kwa wote', 'Elektroniki', 'Mitindo', 'Nyumba', 'Magari', 'Huduma'];

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#071B33" />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>SOKORA</Text>
          <Text style={styles.tagline}>Tazama. Gundua. Nunua.</Text>
        </View>
        <Text style={styles.headerAction}>⌕</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {categories.map((item, index) => (
          <View key={item} style={[styles.category, index === 0 && styles.activeCategory]}>
            <Text style={[styles.categoryText, index === 0 && styles.activeCategoryText]}>{item}</Text>
          </View>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>SOKO LA TANZANIA, KWA NAMNA MPYA</Text>
          <Text style={styles.title}>Biashara zinaanza hapa.</Text>
          <Text style={styles.description}>Gundua video fupi, bidhaa na biashara kutoka Tanzania nzima.</Text>
        </View>
        <Text style={styles.sectionTitle}>Gundua SOKORA</Text>
        <View style={styles.feedPlaceholder}>
          <Text style={styles.play}>▶</Text>
          <Text style={styles.feedTitle}>Video na bidhaa zitaonekana hapa</Text>
          <Text style={styles.feedDescription}>Msingi wa kwanza wa app umewekwa. Hatua inayofuata ni kuunganisha media, akaunti na bidhaa.</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>▣</Text>
            <Text style={styles.infoTitle}>Video fupi</Text>
            <Text style={styles.infoText}>Tazama bila akaunti kwa maudhui ya umma.</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>⌂</Text>
            <Text style={styles.infoTitle}>Biashara</Text>
            <Text style={styles.infoText}>Wauzaji wataweka picha, bei na eneo.</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomNav}>
        <Text style={styles.navActive}>⌂\nNyumbani</Text>
        <Text style={styles.navItem}>⌕\nGundua</Text>
        <Text style={styles.navItem}>＋\nWeka</Text>
        <Text style={styles.navItem}>♡\nUjumbe</Text>
        <Text style={styles.navItem}>◉\nWasifu</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#071B33', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 17, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', letterSpacing: 2 },
  tagline: { color: '#C4D3E4', fontSize: 12, marginTop: 3 },
  headerAction: { color: '#FFFFFF', fontSize: 31, paddingHorizontal: 8 },
  categories: { paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  category: { borderWidth: 1, borderColor: '#D9E1EA', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  activeCategory: { backgroundColor: '#071B33', borderColor: '#071B33' },
  categoryText: { color: '#43546A', fontSize: 12, fontWeight: '600' },
  activeCategoryText: { color: '#FFFFFF' },
  body: { padding: 16, paddingBottom: 22 },
  welcome: { backgroundColor: '#E8EFF7', borderRadius: 18, padding: 20, marginBottom: 22 },
  eyebrow: { color: '#31577D', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#071B33', fontSize: 25, fontWeight: '800', marginTop: 10 },
  description: { color: '#4D5D70', fontSize: 14, lineHeight: 21, marginTop: 8 },
  sectionTitle: { color: '#071B33', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  feedPlaceholder: { minHeight: 230, backgroundColor: '#102B49', borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 24 },
  play: { color: '#FFFFFF', fontSize: 34, marginBottom: 12 },
  feedTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  feedDescription: { color: '#D0DCE8', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  infoCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E4E9EF' },
  infoIcon: { color: '#31577D', fontSize: 22, marginBottom: 8 },
  infoTitle: { color: '#071B33', fontWeight: '800', fontSize: 14 },
  infoText: { color: '#5C6B7C', fontSize: 12, lineHeight: 17, marginTop: 5 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 9, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E1E7EE' },
  navActive: { color: '#071B33', textAlign: 'center', fontWeight: '800', fontSize: 11, lineHeight: 18 },
  navItem: { color: '#788596', textAlign: 'center', fontSize: 11, lineHeight: 18 }
});