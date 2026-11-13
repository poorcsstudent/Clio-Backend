import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import '@/services/tourBackground';
import { TourProvider } from '@/services/tourController';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="light" />
      <TourProvider><AppTabs /></TourProvider>
    </ThemeProvider>
  );
}
