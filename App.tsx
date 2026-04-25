import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { AppProvider } from './src/context/AppContext';
import TabBarIcon from './src/components/TabBarIcon';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AppProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1a0a00" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon route={route.name} focused={focused} color={color} />
            ),
            tabBarActiveTintColor: '#ff6b35',
            tabBarInactiveTintColor: '#8a6a5a',
            tabBarStyle: {
              backgroundColor: '#1a0a00',
              borderTopColor: '#3d1f0a',
              borderTopWidth: 1,
              height: 64,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarLabelStyle: {
              fontFamily: 'System',
              fontSize: 11,
              fontWeight: '600',
            },
            headerStyle: {
              backgroundColor: '#1a0a00',
              shadowColor: 'transparent',
              elevation: 0,
            },
            headerTintColor: '#fff5ef',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
              letterSpacing: 0.5,
            },
          })}
        >
          <Tab.Screen name="Today" component={HomeScreen} options={{ title: 'Today' }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
          <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Analytics' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
