import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useApp, DayRecord } from '../context/AppContext';

function getDayLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function BarGraph({ count, max }: { count: number; max: number }) {
  const w = max > 0 ? Math.max((count / max) * 100, count > 0 ? 8 : 0) : 0;
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${w}%` }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: { flex: 1, height: 6, backgroundColor: '#3d1f0a', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: '#ff6b35', borderRadius: 3 },
});

export default function HistoryScreen() {
  const { history, settings } = useApp();

  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  const maxCount = Math.max(...sorted.map(r => r.count), 1);

  const renderItem = ({ item }: { item: DayRecord }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.dayLabel}>{getDayLabel(item.date)}</Text>
        <Text style={styles.dateSmall}>{item.date}</Text>
      </View>
      <View style={styles.rowMid}>
        <BarGraph count={item.count} max={maxCount} />
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.count}>{item.count}</Text>
        <Text style={styles.cost}>{settings.currency}{item.cost.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.headerText}>DATE</Text>
        <Text style={styles.headerText}>TREND</Text>
        <Text style={styles.headerText}>COUNT / COST</Text>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No history yet</Text>
          <Text style={styles.emptySubtext}>Start logging cigarettes to see your history here.</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.date}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#120600' },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1a0a00',
    borderBottomWidth: 1,
    borderBottomColor: '#3d1f0a',
  },
  headerText: { color: '#8a6a5a', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, flex: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e0e03',
  },
  rowLeft: { flex: 1 },
  rowMid: { flex: 1.5, paddingHorizontal: 12 },
  rowRight: { alignItems: 'flex-end' },

  dayLabel: { color: '#fff5ef', fontSize: 14, fontWeight: '600' },
  dateSmall: { color: '#8a6a5a', fontSize: 11, marginTop: 2 },
  count: { color: '#ff6b35', fontSize: 18, fontWeight: '800' },
  cost: { color: '#8a6a5a', fontSize: 12, marginTop: 2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#fff5ef', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtext: { color: '#8a6a5a', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
