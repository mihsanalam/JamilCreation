import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function SignupScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-4 pb-10" showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Ionicons name="arrow-back" size={28} color="#0F172A" />
          </TouchableOpacity>

          {/* Header */}
          <Text className="text-3xl font-poppins text-dark">Create Account</Text>
          <Text className="text-gray-500 font-inter mt-1 mb-8 text-base">Create your business account</Text>

          {/* Upload Logo Area */}
          <View className="items-center mb-6">
            <TouchableOpacity onPress={pickImage} className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 items-center justify-center mb-2 overflow-hidden">
              {logoUri ? (
                <Image source={{ uri: logoUri }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={32} color="#6b7280" />
                  <Text className="text-primary font-inter text-xs mt-1">Upload Logo</Text>
                </>
              )}
            </TouchableOpacity>
            <Text className="text-gray-400 font-inter text-xs">JPG, PNG up to 2MB</Text>
          </View>

          {/* Full Name */}
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center">
            <Ionicons name="person-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Full Name</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="Jamil Khan" 
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Business Name */}
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center">
            <Ionicons name="business-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Business Name</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="Jamil Creation" 
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Email Address */}
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center">
            <Ionicons name="mail-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Email Address</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="jamilbusiness@gmail.com" 
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center">
            <Ionicons name="call-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Phone Number</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="+1 (555) 123-4567" 
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password */}
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center">
            <Ionicons name="lock-closed-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Password</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="••••••••••" 
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
              />
            </View>
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center">
            <Ionicons name="lock-closed-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Confirm Password</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="••••••••••" 
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
              />
            </View>
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            className="bg-primary rounded-xl py-4 mt-8 items-center shadow-sm shadow-primary/30"
            activeOpacity={0.8}
            onPress={() => router.replace('/(tabs)' as any)}
          >
            <Text className="text-white font-poppins text-lg">Create Account</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row justify-center mt-8 mb-6">
            <Text className="text-gray-500 font-inter text-base">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/login' as any)}>
              <Text className="text-primary font-poppins text-base">Login</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
