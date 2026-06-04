import React from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Home, 
  Package, 
  ArrowRightLeft, 
  BarChart3, 
  Settings as SettingsIcon, 
  User, 
  Sliders, 
  DollarSign, 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  Bell, 
  RefreshCw, 
  FileText,
  ChevronRight
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../services/supabase';
import QRCode from 'react-native-qrcode-svg';
import { Modal, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            // useAuth listener + _layout.tsx will auto-redirect to login
          },
        },
      ]
    );
  };

  const fullName = user?.user_metadata?.full_name || 'Guest User';
  const businessName = user?.user_metadata?.business_name || 'My Business';
  const email = user?.email || 'No email attached';
  const avatarUrl = profileImage || user?.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + fullName;

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, // Need base64 to fix React Native FormData bug
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;

        // Compress before upload: 400px wide, 70% JPEG
        const compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 400 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        setProfileImage(compressed.uri);
        if (!user) return;

        const ext = 'jpeg';
        const fileName = `${user.id}-${Date.now()}.${ext}`;
        const fileBody = decode(compressed.base64!);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, fileBody, { 
            contentType: `image/${ext}`,
            upsert: true 
          });

        if (uploadError) {
          console.error('Upload Error:', uploadError);
          alert('Failed to upload image. Please try again.');
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Update user metadata
        await supabase.auth.updateUser({
          data: { avatar_url: publicUrlData.publicUrl }
        });
        
        alert('Profile picture updated successfully!');
      }
    } catch (error: any) {
      alert('Error updating profile: ' + error.message);
    }
  };

  // MFA State
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const startMfaEnrollment = async () => {
    try {
      setMfaLoading(true);
      setMfaModalVisible(true);
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      
      setMfaFactorId(data.id);
      setQrCodeUrl(data.totp.uri);
    } catch (e: any) {
      alert('Error starting 2FA: ' + e.message);
      setMfaModalVisible(false);
    } finally {
      setMfaLoading(false);
    }
  };

  const verifyMfaEnrollment = async () => {
    if (!mfaVerifyCode || mfaVerifyCode.length < 6) return;
    try {
      setMfaLoading(true);
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaVerifyCode,
      });

      if (verify.error) throw verify.error;

      alert('2FA successfully enabled!');
      setMfaModalVisible(false);
      setMfaVerifyCode('');
    } catch (e: any) {
      alert('Verification failed: ' + e.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const renderSettingItem = (icon: React.ReactNode, title: string, rightContent?: React.ReactNode, onPress?: () => void) => (
    <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <View className="flex-row items-center">
        <View className="w-8 items-center justify-center mr-3">
          {icon}
        </View>
        <Text className="text-dark font-inter text-sm">{title}</Text>
      </View>
      <View className="flex-row items-center">
        {rightContent}
        <ChevronRight size={16} color="#9ca3af" className="ml-2" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="mb-6">
          <Text className="text-dark font-poppins text-2xl">Settings</Text>
        </View>

        {/* Profile Card */}
        <View className="bg-white border border-gray-100 rounded-3xl p-5 mb-8 shadow-sm shadow-gray-200/50 flex-row items-center">
          <TouchableOpacity onPress={pickImage} className="w-16 h-16 rounded-full bg-dark items-center justify-center mr-4 overflow-hidden relative">
            <Image 
              source={{ uri: avatarUrl }} 
              className="w-16 h-16" 
              resizeMode="cover" 
            />
            <View className="absolute bottom-0 bg-black/40 w-full items-center py-0.5">
              <Text className="text-white text-[8px] font-inter">EDIT</Text>
            </View>
          </TouchableOpacity>
          <View>
            <Text className="text-dark font-poppins text-lg">{fullName}</Text>
            <Text className="text-gray-500 font-inter text-xs mt-0.5">{businessName}</Text>
            <Text className="text-gray-400 font-inter text-xs mt-0.5">{email}</Text>
          </View>
        </View>

        {/* Business Settings */}
        <View className="mb-6">
          <Text className="text-dark font-poppins text-sm mb-3">Business Settings</Text>
          <View className="bg-white border border-gray-100 rounded-3xl px-4 py-1 shadow-sm shadow-gray-200/50">
            {renderSettingItem(<User size={20} color="#64748b" />, "Business Profile")}
            {renderSettingItem(<Sliders size={20} color="#64748b" />, "Preferences")}
            {renderSettingItem(
              <DollarSign size={20} color="#64748b" />, 
              "Currency", 
              <Text className="text-gray-500 font-inter text-xs">USD ($)</Text>
            )}
          </View>
        </View>

        {/* Account & Security */}
        <View className="mb-6">
          <Text className="text-dark font-poppins text-sm mb-3">Account & Security</Text>
          <View className="bg-white border border-gray-100 rounded-3xl px-4 py-1 shadow-sm shadow-gray-200/50">
            {renderSettingItem(<Lock size={20} color="#64748b" />, "Change Password")}
            {renderSettingItem(<ShieldCheck size={20} color="#64748b" />, "Two-Factor Authentication", undefined, startMfaEnrollment)}
            {renderSettingItem(<Smartphone size={20} color="#64748b" />, "Device Management")}
          </View>
        </View>

        {/* App Settings */}
        <View className="mb-8">
          <Text className="text-dark font-poppins text-sm mb-3">App Settings</Text>
          <View className="bg-white border border-gray-100 rounded-3xl px-4 py-1 shadow-sm shadow-gray-200/50">
            {renderSettingItem(<Bell size={20} color="#64748b" />, "Notifications")}
            {renderSettingItem(<RefreshCw size={20} color="#64748b" />, "Backup & Sync")}
            {renderSettingItem(<FileText size={20} color="#64748b" />, "Data Export")}
          </View>
        </View>

        {/* Logout */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 border border-red-100 rounded-3xl px-5 py-4 flex-row items-center justify-center"
          >
            <Text className="text-red-500 font-poppins text-base">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Extra spacing for Bottom Bar */}
        <View className="h-24" />
      </ScrollView>

      <BottomNav currentRoute="/settings" />

      {/* 2FA Enrollment Modal */}
      <Modal
        visible={mfaModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMfaModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white px-6 py-8">
          <Text className="text-3xl font-poppins text-dark text-center mb-2">Enable 2FA</Text>
          <Text className="text-gray-500 font-inter text-center mb-8">Scan this QR code with your Authenticator app (like Google Authenticator or Authy).</Text>
          
          <View className="items-center justify-center bg-gray-50 rounded-3xl py-8 mb-8 border border-gray-200">
            {mfaLoading && !qrCodeUrl ? (
              <ActivityIndicator size="large" color="#0F172A" />
            ) : qrCodeUrl ? (
              <QRCode value={qrCodeUrl} size={200} />
            ) : null}
          </View>

          <Text className="text-dark font-poppins text-sm text-center mb-3">Enter the 6-digit code to verify</Text>
          <View className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center mb-6">
            <TextInput 
              className="flex-1 font-poppins text-dark text-2xl tracking-[0.5em] text-center" 
              placeholder="000000" 
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={6}
              value={mfaVerifyCode}
              onChangeText={setMfaVerifyCode}
            />
          </View>

          <TouchableOpacity 
            className="bg-primary rounded-xl py-4 items-center shadow-sm shadow-primary/30"
            activeOpacity={0.8}
            onPress={verifyMfaEnrollment}
            disabled={mfaLoading || !qrCodeUrl || mfaVerifyCode.length < 6}
          >
            <Text className="text-white font-poppins text-lg">
              {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setMfaModalVisible(false)} className="mt-6 items-center">
            <Text className="text-gray-500 font-inter text-base">Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
