import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const BAR_WIDTH = (width - 80) / 7;

function WeekBar({ record, maxVal }: { record: { date: string; count: number }; maxVal: number }) {
  const dayName = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
  const height = maxVal > 0 ? Math.max((record.count / maxVal) * 100, record.count > 0 ? 6 : 0) : 0;
  const isToday = record.date === new Date().toISOString().split('T')[0];

  return (
    <View style={weekBarStyles.col}>
      <Text style={weekBarStyles.count}>{record.count > 0 ? record.count : ''}</Text>
      <View style={weekBarStyles.barTrack}>
        <View style={[weekBarStyles.barFill, { height: `${height}%` }, isToday && weekBarStyles.today]} />
      </View>
      <Text style={[weekBarStyles.day, isToday && weekBarStyles.dayToday]}>{dayName}</Text>
    </View>
  );
}

const weekBarStyles = StyleSheet.create({
  col: { alignItems: 'center', flex: 1 },
  barTrack: { width: BAR_WIDTH - 8, height: 100, backgroundColor: '#1e0e03', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: '#7a3f22', borderRadius: 6 },
  today: { backgroundColor: '#ff6b35' },
  day: { color: '#8a6a5a', fontSize: 11, marginTop: 6, fontWeight: '500' },
  dayToday: { color: '#ff6b35', fontWeight: '700' },
  count: { color: '#c9a898', fontSize: 11, marginBottom: 4, fontWeight: '600', height: 16 },
});

function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={statBlockStyles.card}>
      <Text style={statBlockStyles.value}>{value}</Text>
      <Text style={statBlockStyles.label}>{label}</Text>
      {sub ? <Text style={statBlockStyles.sub}>{sub}</Text> : null}
    </View>
  );
}
const statBlockStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#1e0e03',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#3d1f0a',
    alignItems: 'center', minHeight: 90, justifyContent: 'center',
  },
  value: { color: '#ff6b35', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  label: { color: '#8a6a5a', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  sub: { color: '#5a3a2a', fontSize: 10, marginTop: 2 },
});

export default function StatsScreen() {
  const { weeklyData, totalSmoked, totalSpent, averagePerDay, longestStreak, currentStreak, settings, history } = useApp();
  const maxWeek = Math.max(...weeklyData.map(r => r.count), 1);
  const weeklyCigs = weeklyData.reduce((s, r) => s + r.count, 0);
  const weeklyCost = weeklyData.reduce((s, r) => s + r.cost, 0);
  const yearlyCostProjection = averagePerDay * (settings.pricePerPack / settings.cigarettesPerPack) * 365;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Weekly Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Last 7 Days</Text>
        <View style={styles.weekRow}>
          {weeklyData.map(r => (
            <WeekBar key={r.date} record={r} maxVal={maxWeek} />
          ))}
        </View>
        <View style={styles.weekSummary}>
          <Text style={styles.weekSummaryText}>{weeklyCigs} cigarettes</Text>
          <Text style={styles.weekSummaryText}>{settings.currency}{weeklyCost.toFixed(2)} spent</Text>
        </View>
      </View>

      {/* Key Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Time</Text>
        <View style={styles.grid}>
          <StatBlock label="Total Smoked" value={String(totalSmoked)} sub="cigarettes" />
          <View style={{ width: 10 }} />
          <StatBlock label="Total Spent" value={`${settings.currency}${totalSpent.toFixed(0)}`} />
        </View>
        <View style={[styles.grid, { marginTop: 10 }]}>
          <StatBlock label="Daily Average" value={String(averagePerDay)} sub="per day" />
          <View style={{ width: 10 }} />
          <StatBlock label="Days Tracked" value={String(history.length)} sub="days" />
        </View>
      </View>

      {/* Streaks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streaks</Text>
        <View style={styles.grid}>
          <StatBlock label="Current Streak" value={`${currentStreak}d`} sub="days in a row" />
          <View style={{ width: 10 }} />
          <StatBlock label="Longest Streak" value={`${longestStreak}d`} sub="personal best" />
        </View>
      </View>

      {/* Projection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Projection</Text>
        <View style={styles.projectionCard}>
          <Text style={styles.projBig}>{settings.currency}{yearlyCostProjection.toFixed(0)}</Text>
          <Text style={styles.projLabel}>Projected annual spend at current rate</Text>
          <View style={styles.projDivider} />
          <Text style={styles.projSub}>
            {(averagePerDay * 365).toFixed(0)} cigarettes/year · {(averagePerDay * 30).toFixed(0)}/month avg
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#120600' },
  content: { padding: 20, paddingBottom: 40 },

  section: { marginBottom: 28 },
  sectionTitle: { color: '#8a6a5a', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 },

  weekRow: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#1a0a00', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#3d1f0a' },
  weekSummary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 },
  weekSummaryText: { color: '#c9a898', fontSize: 13, fontWeight: '500' },

  grid: { flexDirection: 'row' },

  projectionCard: {
    backgroundColor: '#1e0e03', borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: '#ff6b3540',
    alignItems: 'center',
  },
  projBig: { color: '#ff6b35', fontSize: 42, fontWeight: '800', marginBottom: 4 },
  projLabel: { color: '#8a6a5a', fontSize: 13, textAlign: 'center' },
  projDivider: { width: 40, height: 1, backgroundColor: '#3d1f0a', marginVertical: 12 },
  projSub: { color: '#5a3a2a', fontSize: 12, textAlign: 'center' },
});
