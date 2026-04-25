import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';

function SettingRow({ label, value, onChangeText, keyboardType, prefix, suffix }: {
  label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; prefix?: string; suffix?: string;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          placeholderTextColor="#5a3a2a"
          selectionColor="#ff6b35"
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useApp();

  const [pricePerPack, setPricePerPack] = useState(String(settings.pricePerPack));
  const [cigarettesPerPack, setCigarettesPerPack] = useState(String(settings.cigarettesPerPack));
  const [currency, setCurrency] = useState(settings.currency);
  const [dailyGoal, setDailyGoal] = useState(String(settings.dailyGoal));

  const handleSave = () => {
    const ppp = parseFloat(pricePerPack);
    const cpp = parseInt(cigarettesPerPack);
    const dg = parseInt(dailyGoal);

    if (isNaN(ppp) || ppp <= 0) return Alert.alert('Invalid', 'Enter a valid price per pack.');
    if (isNaN(cpp) || cpp <= 0) return Alert.alert('Invalid', 'Enter a valid cigarettes per pack number.');
    if (isNaN(dg) || dg <= 0) return Alert.alert('Invalid', 'Enter a valid daily goal.');

    updateSettings({ pricePerPack: ppp, cigarettesPerPack: cpp, currency: currency || '$', dailyGoal: dg });
    Alert.alert('Saved', 'Your settings have been updated.');
  };

  const pricePerCig = (parseFloat(pricePerPack) / parseInt(cigarettesPerPack));
  const validCalc = !isNaN(pricePerCig) && isFinite(pricePerCig);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRICING</Text>

          <SettingRow
            label="Pack Price"
            value={pricePerPack}
            onChangeText={setPricePerPack}
            keyboardType="decimal-pad"
            prefix={currency}
          />
          <SettingRow
            label="Cigarettes per Pack"
            value={cigarettesPerPack}
            onChangeText={setCigarettesPerPack}
            keyboardType="number-pad"
            suffix="cigs"
          />
          <SettingRow
            label="Currency Symbol"
            value={currency}
            onChangeText={setCurrency}
          />

          {validCalc && (
            <View style={styles.calcRow}>
              <Text style={styles.calcText}>
                = {currency}{pricePerCig.toFixed(3)} per cigarette
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GOALS</Text>
          <SettingRow
            label="Daily Goal (max)"
            value={dailyGoal}
            onChangeText={setDailyGoal}
            keyboardType="number-pad"
            suffix="cigs/day"
          />
          <Text style={styles.hintText}>You'll be warned when you approach or exceed this.</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>

        {/* About */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>🚬 Smoke Tracker</Text>
          <Text style={styles.aboutText}>Track your smoking habits and costs. All data is stored locally on your device — private and offline.</Text>
          <Text style={styles.aboutVersion}>v1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#120600' },
  content: { padding: 20, paddingBottom: 40 },

  section: {
    marginBottom: 28,
    backgroundColor: '#1a0a00',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3d1f0a',
  },
  sectionTitle: {
    color: '#8a6a5a', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 16,
  },

  settingRow: {
    marginBottom: 14,
  },
  settingLabel: { color: '#c9a898', fontSize: 13, fontWeight: '500', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0e0400',
    borderRadius: 10, borderWidth: 1, borderColor: '#3d1f0a',
    paddingHorizontal: 12, height: 44,
  },
  prefix: { color: '#ff6b35', fontSize: 16, fontWeight: '600', marginRight: 6 },
  suffix: { color: '#8a6a5a', fontSize: 13, marginLeft: 6 },
  input: {
    flex: 1, color: '#fff5ef', fontSize: 16, fontWeight: '600', padding: 0,
  },

  calcRow: {
    marginTop: 4, paddingHorizontal: 2,
  },
  calcText: { color: '#ff6b35', fontSize: 13, fontWeight: '500' },

  hintText: { color: '#5a3a2a', fontSize: 12, marginTop: 6, lineHeight: 18 },

  saveButton: {
    backgroundColor: '#ff6b35',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  aboutCard: {
    backgroundColor: '#1a0a00',
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#3d1f0a',
    alignItems: 'center',
  },
  aboutTitle: { color: '#fff5ef', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  aboutText: { color: '#8a6a5a', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  aboutVersion: { color: '#5a3a2a', fontSize: 12, marginTop: 10 },
});
