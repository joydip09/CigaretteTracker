import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { showNotification } from '../../notification';

const { width } = Dimensions.get('window');
const UNDO_WINDOW_MS = 3 * 60 * 1000; // 3 minutes
// Typical nicotine per cigarette range: 0.8–1.2 mg per stick (can adjust)
const calculateNicotineRange = (count: number) => {
  const minNicotine = 0.8 * count;
  const maxNicotine = 1.2 * count;
  return `${Math.round(minNicotine)}–${Math.round(maxNicotine)}`;
};

export default function HomeScreen() {
  const {
    todayCount,
    todayCost,
    addCigarette,
    removeCigarette,
    settings,
    lastLogTime,
    clearLastLogTime,
  } = useApp();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goalPercent = Math.min((todayCount / settings.dailyGoal) * 100, 100);
  const overGoal = todayCount > settings.dailyGoal;

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!lastLogTime) {
      setSecondsLeft(0);
      return;
    }

    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((UNDO_WINDOW_MS - (Date.now() - lastLogTime)) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        clearLastLogTime();
      }
    };
    update();
    timerRef.current = setInterval(update, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lastLogTime, clearLastLogTime]);

  const canUndo = todayCount > 0 && secondsLeft > 0;
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const undoProgress = secondsLeft / (UNDO_WINDOW_MS / 1000);
  const undoColor =
    secondsLeft > 120 ? '#34c759' : secondsLeft > 60 ? '#ffcc00' : '#ff6b35';

  const warningMessages = [
    'Bro... that’s not a limit anymore 😭',
    'Your lungs just filed a complaint 📝',
    'Easy there, chimney 🏭',
    "At this point you're speedrunning it 💀",
    'That cigarette didn’t even stand a chance 😶‍🌫️',
    'Relax... it’s not a competition 🏁',
    'Your future self is side-eyeing you right now 👀',
    'Even your lighter needs a break 🔥',
    'You’re way past the ‘just one more’ phase 😬',
    'Okay this is getting suspicious 🤨',
    'Your daily goal is crying in the corner 🥲',
    'Plot twist: you were supposed to STOP at the limit',
    'Your lungs: ‘we need to talk’ 😐',
    'Achievement unlocked: Overlimit Master 🏆',
    'This wasn’t in the plan, was it? 😅',
  ];

  const handleAdd = () => {
    Vibration.vibrate(50);

    const newCount = todayCount + 1;

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.92,
          useNativeDriver: false,
          speed: 50,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: false,
          speed: 20,
          bounciness: 12,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    addCigarette();

    if (newCount > settings.dailyGoal) {
      const randomMessage =
        warningMessages[Math.floor(Math.random() * warningMessages.length)];

      showNotification('Limit Exceeded 🚬', randomMessage);
    }
  };

  const handleUndo = () => {
    if (!canUndo) return;
    Vibration.vibrate(30);
    removeCigarette();
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,107,53,0)', 'rgba(255,107,53,0.35)'],
  });

  const progressColor = overGoal ? '#ff3b30' : '#ff6b35';
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.dateText}>{dateLabel}</Text>

      <Animated.View
        style={[styles.counterWrapper, { transform: [{ scale: scaleAnim }] }]}
      >
        <Animated.View
          style={[styles.counterGlow, { backgroundColor: glowColor }]}
        />
        <View style={styles.counterCard}>
          <Text style={styles.counterLabel}>SMOKED TODAY</Text>
          <Text style={styles.counterNumber}>{todayCount}</Text>
          <Text style={styles.counterSub}>
            cigarette{todayCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </Animated.View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAdd}
        activeOpacity={0.8}
      >
        <View style={styles.addButtonInner}>
          <Text style={styles.addButtonIcon}>🚬</Text>
          <Text style={styles.addButtonText}>Log a Cigarette</Text>
        </View>
      </TouchableOpacity>

      {/* ── TIMED UNDO ── */}
      {todayCount > 0 && (
        <View style={styles.undoContainer}>
          {canUndo ? (
            <TouchableOpacity
              style={[styles.undoActiveButton, { borderColor: undoColor }]}
              onPress={handleUndo}
              activeOpacity={0.75}
            >
              <View style={styles.undoProgressTrack}>
                <View
                  style={[
                    styles.undoProgressFill,
                    {
                      width: `${undoProgress * 100}%`,
                      backgroundColor: undoColor + '28',
                    },
                  ]}
                />
              </View>
              <View style={styles.undoRow}>
                <Text style={[styles.undoIcon, { color: undoColor }]}>↩</Text>
                <View style={styles.undoTextGroup}>
                  <Text style={[styles.undoLabel, { color: undoColor }]}>
                    Undo last
                  </Text>
                  <Text style={styles.undoSub}>
                    window closes in {formatTime(secondsLeft)}
                  </Text>
                </View>
                <View style={[styles.undoBadge, { borderColor: undoColor }]}>
                  <Text style={[styles.undoBadgeText, { color: undoColor }]}>
                    {formatTime(secondsLeft)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.undoExpired}>
              <Text style={styles.undoExpiredIcon}>🔒</Text>
              <View style={styles.undoTextGroup}>
                <Text style={styles.undoExpiredLabel}>Undo expired</Text>
                <Text style={styles.undoExpiredSub}>
                  Log within 3 min to undo
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {settings.currency}
            {todayCost.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Today's Cost</Text>
        </View>
        <View style={[styles.statCard, styles.statCardMid]}>
          <Text style={[styles.statValue, overGoal && styles.overGoalText]}>
            {todayCount}/{settings.dailyGoal}
          </Text>
          <Text style={styles.statLabel}>Daily Goal</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.statValueSmall]}>
            {calculateNicotineRange(todayCount)} mg
          </Text>
          <Text style={styles.statLabel}>Nicotine Intake</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Daily Goal Progress</Text>
          <Text
            style={[styles.progressPercent, overGoal && styles.overGoalText]}
          >
            {overGoal
              ? `+${todayCount - settings.dailyGoal} over limit`
              : `${Math.round(goalPercent)}%`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${goalPercent}%`, backgroundColor: progressColor },
            ]}
          />
        </View>
      </View>

      <View style={styles.motivationCard}>
        <Text style={styles.motivationText}>
          {todayCount === 0
            ? '🌟 Great start — zero today!'
            : overGoal
            ? `⚠️ You're ${
                todayCount - settings.dailyGoal
              } over your goal. Take a break.`
            : `💪 ${
                settings.dailyGoal - todayCount
              } more until your limit. Stay mindful.`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#120600' },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  dateText: {
    color: '#8a6a5a',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  counterWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
  counterGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  counterCard: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1e0e03',
    borderWidth: 2,
    borderColor: '#ff6b35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterLabel: {
    color: '#8a6a5a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  counterNumber: {
    color: '#fff5ef',
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 80,
  },
  counterSub: {
    color: '#ff6b35',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },

  addButton: {
    width: width - 40,
    backgroundColor: '#ff6b35',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  addButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  addButtonIcon: { fontSize: 22 },
  addButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  undoContainer: { width: width - 40, marginBottom: 20 },

  undoActiveButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#1e0e03',
  },
  undoProgressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  undoProgressFill: { height: '100%', borderRadius: 14 },
  undoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  undoIcon: { fontSize: 22, fontWeight: '700' },
  undoTextGroup: { flex: 1 },
  undoLabel: { fontSize: 15, fontWeight: '700' },
  undoSub: { color: '#8a6a5a', fontSize: 11, marginTop: 1 },
  undoBadge: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  undoBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  undoExpired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#140700',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a1005',
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  undoExpiredIcon: { fontSize: 16 },
  undoExpiredLabel: { color: '#4a2a1a', fontSize: 13, fontWeight: '600' },
  undoExpiredSub: { color: '#3a1a0a', fontSize: 11, marginTop: 1 },

  statsRow: { flexDirection: 'row', width: '100%', marginBottom: 20, gap: 10 },
  statCard: {
    flex: 1,
    minWidth: 90, // ensure enough space
    maxWidth: 110, // limit expansion
    backgroundColor: '#1e0e03',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3d1f0a',
    alignItems: 'center',
  },
  statValueSmall: {
    fontSize: 16,
  },
  statCardMid: { borderColor: '#ff6b35' },
  statValue: {
    color: '#fff5ef',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: { color: '#8a6a5a', fontSize: 11, fontWeight: '500' },
  overGoalText: { color: '#ff3b30' },

  progressSection: { width: '100%', marginBottom: 16 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { color: '#8a6a5a', fontSize: 13, fontWeight: '500' },
  progressPercent: { color: '#ff6b35', fontSize: 13, fontWeight: '700' },
  progressTrack: {
    height: 8,
    backgroundColor: '#3d1f0a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4 },

  motivationCard: {
    width: '100%',
    backgroundColor: '#1e0e03',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3d1f0a',
    marginTop: 8,
  },
  motivationText: {
    color: '#c9a898',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
