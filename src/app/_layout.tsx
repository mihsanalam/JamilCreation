import '../../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme, AppState } from 'react-native';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { sync } from '../db/sync';
import { registerForPushNotifications } from '../services/notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep splash visible until fonts AND auth are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Inter_400Regular,
  });

  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // ── Hide splash when fonts are loaded AND auth is ready ───────────────────
  useEffect(() => {
    if (fontsLoaded && !loading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading]);

  // ── Auth-based navigation ─────────────────────────────────────────────────
  useEffect(() => {
    // Wait until fonts are loaded AND auth is resolved
    if (!fontsLoaded || loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }
  }, [session, loading, fontsLoaded, segments]);

  // ── Background sync ───────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !session) return;

    // Small delay so the UI renders first
    const timer = setTimeout(() => {
      sync().catch(e => console.warn('Initial sync failed', e));
    }, 1500);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        sync().catch(e => console.warn('Foreground sync failed', e));
      }
    });

    // Register push token with business_name for business-scoped notifications
    const userBusinessName = session.user.user_metadata?.business_name;
    registerForPushNotifications(session.user.id, userBusinessName);

    // Listen for notifications received while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(_notification => {
      // You can update a badge count or local state here if needed
    });

    // Listen for user tapping a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const type = response.notification.request.content.data?.type;
      if (type === 'low_stock' || type === 'new_product') {
        router.push('/(tabs)/inventory' as any);
      } else if (type === 'sale') {
        router.push('/(tabs)/transactions' as any);
      } else if (type === 'sync') {
        router.push('/(tabs)' as any);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [session, loading]);

  // ── Don't render the navigator until fonts are ready AND auth is resolved ──
  // This avoids the "blank/white" flash before fonts/auth load — the native splash
  // screen stays visible in this gap because we called preventAutoHideAsync().
  if (!fontsLoaded || loading) {
    return null; // Splash screen stays shown
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="product/add" options={{ presentation: 'modal' }} />
          <Stack.Screen name="product/sell" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
