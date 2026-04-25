import React from 'react';
import { Text } from 'react-native';

const icons: Record<string, [string, string]> = {
  Today: ['🚬', '🚬'],
  History: ['📋', '📋'],
  Stats: ['📊', '📊'],
  Settings: ['⚙️', '⚙️'],
};

export default function TabBarIcon({ route, focused, color }: { route: string; focused: boolean; color: string }) {
  const [icon] = icons[route] || ['●', '○'];
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
  );
}
