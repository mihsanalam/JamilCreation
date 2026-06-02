import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
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

export default function SettingsScreen() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const renderSettingItem = (icon: React.ReactNode, title: string, rightContent?: React.ReactNode) => (
    <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-50 last:border-0">
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
              source={profileImage ? { uri: profileImage } : require('@/assets/images/jamil_creation_logo.png')} 
              className={profileImage ? "w-16 h-16" : "w-12 h-12"} 
              resizeMode="cover" 
            />
            <View className="absolute bottom-0 bg-black/40 w-full items-center py-0.5">
              <Text className="text-white text-[8px] font-inter">EDIT</Text>
            </View>
          </TouchableOpacity>
          <View>
            <Text className="text-dark font-poppins text-lg">Jamil Khan</Text>
            <Text className="text-gray-500 font-inter text-xs mt-0.5">Business Owner</Text>
            <Text className="text-gray-400 font-inter text-xs mt-0.5">jamilbusiness@gmail.com</Text>
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
            {renderSettingItem(<ShieldCheck size={20} color="#64748b" />, "Two-Factor Authentication")}
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

        {/* Extra spacing for Bottom Bar */}
        <View className="h-24" />
      </ScrollView>

      <BottomNav currentRoute="/settings" />
    </SafeAreaView>
  );
}
