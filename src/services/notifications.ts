/**
 * Push Notification Service for Jamil Creation
 *
 * This service handles:
 * 1. Requesting permission & getting the Expo push token
 * 2. Saving the token to Supabase so other users/devices can be notified
 * 3. Handling incoming notifications (foreground + background tap)
 * 4. Sending local notifications for events that happen on-device
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// ── Notification behaviour while the app is in the foreground ─────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Register device and store push token in Supabase
// Call this once on login / app start (when user session is available)
// ─────────────────────────────────────────────────────────────────────────────
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices.');
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied.');
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('inventory', {
      name: 'Inventory Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
  }

  // Get the Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('EAS projectId not found in app.json extra.eas.projectId');
    return null;
  }

  const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData;

  // Save token to Supabase (upsert by user_id)
  // You need to create a `push_tokens` table in Supabase — SQL at the bottom of this file
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) console.error('Failed to save push token:', error);

  return token;
}

// ─────────────────────────────────────────────────────────────────────────────
// Local notification helpers — show a notification on THIS device
// ─────────────────────────────────────────────────────────────────────────────

/** 🔴 Low stock alert */
export async function notifyLowStock(productName: string, remaining: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Low Stock Alert',
      body: `${productName} is running low — only ${remaining} units left.`,
      data: { type: 'low_stock' },
    },
    trigger: null, // show immediately
  });
}

/** 💰 Sale recorded notification */
export async function notifySaleRecorded(productName: string, qty: number, revenue: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💰 Sale Recorded',
      body: `${qty}× ${productName} sold · Revenue: ৳${revenue.toFixed(2)}`,
      data: { type: 'sale' },
    },
    trigger: null,
  });
}

/** 📦 New product added by another user (call after sync pull) */
export async function notifyNewProduct(productName: string, addedBy: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📦 New Product Added',
      body: `${addedBy} added "${productName}" to inventory.`,
      data: { type: 'new_product' },
    },
    trigger: null,
  });
}

/** 🔄 Sync completed */
export async function notifySyncComplete(pushed: number, pulled: number) {
  if (pushed === 0 && pulled === 0) return; // don't notify if nothing changed
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔄 Sync Complete',
      body: `Pushed ${pushed} change${pushed !== 1 ? 's' : ''}, pulled ${pulled} update${pulled !== 1 ? 's' : ''}.`,
      data: { type: 'sync' },
    },
    trigger: null,
  });
}
