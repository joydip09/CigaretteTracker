import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, NativeModules, Platform } from 'react-native';

export interface DayRecord {
  date: string;
  count: number;
  cost: number;
}

export interface Settings {
  pricePerPack: number;
  cigarettesPerPack: number;
  currency: string;
  dailyGoal: number;
}

interface AppContextType {
  todayCount: number;
  todayCost: number;
  history: DayRecord[];
  settings: Settings;
  addCigarette: () => void;
  removeCigarette: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  todayDate: string;
  weeklyData: DayRecord[];
  totalSpent: number;
  totalSmoked: number;
  averagePerDay: number;
  longestStreak: number;
  currentStreak: number;
  lastLogTime: number | null;
  clearLastLogTime: () => void;
}

const defaultSettings: Settings = {
  pricePerPack: 11.0,
  cigarettesPerPack: 1,
  currency: '৳',
  dailyGoal: 10,
};

const AppContext = createContext<AppContextType | null>(null);

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [lastLogTime, setLastLogTime] = useState<number | null>(null);
  const todayDate = getTodayString();

  const loadData = useCallback(async () => {
    try {
      const [historyRaw, settingsRaw] = await Promise.all([
        AsyncStorage.getItem('history'),
        AsyncStorage.getItem('settings'),
      ]);
      const loadedSettings = settingsRaw
        ? { ...defaultSettings, ...JSON.parse(settingsRaw) }
        : defaultSettings;
      const loadedHistory = historyRaw ? JSON.parse(historyRaw) : [];
      setSettings(loadedSettings);
      setHistory(loadedHistory);
      if (Platform.OS === 'android' && NativeModules.SmokeWidgetBridge) {
        const today = getTodayString();
        const todayRecord = loadedHistory.find(
          (r: DayRecord) => r.date === today,
        );
        if (todayRecord)
          NativeModules.SmokeWidgetBridge.updateWidgetCount(
            todayRecord.count,
            today,
          );
        NativeModules.SmokeWidgetBridge.syncSettings(
          loadedSettings.pricePerPack / loadedSettings.cigarettesPerPack,
          loadedSettings.currency,
        );
      }
    } catch (e) {
      console.error('Failed to load data', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (Platform.OS === 'android' && NativeModules.SmokeWidgetBridge) {
      NativeModules.SmokeWidgetBridge.syncSettings(
        settings.pricePerPack / settings.cigarettesPerPack,
        settings.currency,
      );
    }
  }, [settings]);

  const updateTodayRecordInternal = useCallback(
    async (count: number, hist: DayRecord[], s: Settings) => {
      const cost = parseFloat((count * pricePerCig(s)).toFixed(2));
      const updated = hist.filter(r => r.date !== todayDate);
      if (count > 0) updated.push({ date: todayDate, count, cost });
      updated.sort((a, b) => b.date.localeCompare(a.date));
      await saveHistory(updated);
      if (Platform.OS === 'android' && NativeModules.SmokeWidgetBridge) {
        NativeModules.SmokeWidgetBridge.updateWidgetCount(count, todayDate);
      }
    },
    [todayDate],
  );

  const syncFromWidget = useCallback(async () => {
    if (Platform.OS !== 'android' || !NativeModules.SmokeWidgetBridge) return;
    try {
      const pending = await NativeModules.SmokeWidgetBridge.getPendingCount();
      if (pending && pending.count > 0 && pending.date === getTodayString()) {
        const currentRecord = history.find(r => r.date === pending.date);
        const currentCount = currentRecord?.count ?? 0;
        if (pending.count > currentCount) {
          await updateTodayRecordInternal(pending.count, history, settings);
          // Widget logs don't reset the undo timer — only in-app taps do
        }
      }
    } catch {}
  }, [history, settings, updateTodayRecordInternal]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') syncFromWidget();
    });

    return () => subscription.remove();
  }, [syncFromWidget]);

  const saveHistory = async (newHistory: DayRecord[]) => {
    await AsyncStorage.setItem('history', JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const pricePerCig = (s: Settings) => s.pricePerPack / s.cigarettesPerPack;

  const addCigarette = useCallback(async () => {
    const today = history.find(r => r.date === todayDate) || {
      date: todayDate,
      count: 0,
      cost: 0,
    };
    await updateTodayRecordInternal(today.count + 1, history, settings);
    setLastLogTime(Date.now()); // start the 3-min undo window
  }, [history, settings, todayDate, updateTodayRecordInternal]);

  const removeCigarette = useCallback(async () => {
    const today = history.find(r => r.date === todayDate) || {
      date: todayDate,
      count: 0,
      cost: 0,
    };
    if (today.count > 0) {
      await updateTodayRecordInternal(today.count - 1, history, settings);
      setLastLogTime(null); // undo used — window closes immediately
    }
  }, [history, settings, todayDate, updateTodayRecordInternal]);

  const clearLastLogTime = useCallback(() => {
    setLastLogTime(null);
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    await AsyncStorage.setItem('settings', JSON.stringify(merged));
  };

  const todayRecord = history.find(r => r.date === todayDate) || {
    date: todayDate,
    count: 0,
    cost: 0,
  };
  const todayCount = todayRecord.count;
  const todayCost = parseFloat((todayCount * pricePerCig(settings)).toFixed(2));

  const weeklyData: DayRecord[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return (
      history.find(r => r.date === dateStr) || {
        date: dateStr,
        count: 0,
        cost: 0,
      }
    );
  });

  const totalSmoked = history.reduce((sum, r) => sum + r.count, 0);
  const totalSpent = parseFloat(
    history.reduce((sum, r) => sum + r.cost, 0).toFixed(2),
  );
  const averagePerDay =
    history.length > 0
      ? parseFloat((totalSmoked / history.length).toFixed(1))
      : 0;

  let currentStreak = 0,
    longestStreak = 0,
    tempStreak = 0;
  const sortedHistory = [...history].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  for (let i = 0; i < sortedHistory.length; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const expected = d.toISOString().split('T')[0];
    if (sortedHistory[i]?.date === expected && sortedHistory[i].count > 0) {
      tempStreak++;
      if (i === 0 || currentStreak === i) currentStreak = tempStreak;
    } else {
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      tempStreak = 0;
    }
  }
  if (tempStreak > longestStreak) longestStreak = tempStreak;

  return (
    <AppContext.Provider
      value={{
        todayCount,
        todayCost,
        history,
        settings,
        addCigarette,
        removeCigarette,
        updateSettings,
        todayDate,
        weeklyData,
        totalSpent,
        totalSmoked,
        averagePerDay,
        longestStreak,
        currentStreak,
        lastLogTime,
        clearLastLogTime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
