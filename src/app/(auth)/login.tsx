import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-12 pb-6">
          {/* Logo Placeholder */}
          <View className="items-center mt-4 mb-8">
            <Image 
              source={require('@/assets/images/jamil_creation_logo.png')} 
              className="w-48 h-48"
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <Text className="text-3xl font-poppins text-dark">Welcome Back 👋</Text>
          <Text className="text-gray-500 font-inter mt-1 mb-6 text-base">Sign in to continue to your account</Text>

          {/* Email Input */}
          <View className="relative border border-gray-300 rounded-xl px-4 py-3 mt-4 flex-row items-center">
            <View className="absolute -top-2.5 left-3 bg-white px-1 z-10">
              <Text className="text-gray-500 text-sm font-inter">Email Address</Text>
            </View>
            <TextInput 
              className="flex-1 font-inter text-dark text-lg pt-1" 
              placeholder="jamilbusiness@gmail.com" 
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View className="relative border border-gray-300 rounded-xl px-4 py-3 mt-6 flex-row items-center">
            <View className="absolute -top-2.5 left-3 bg-white px-1 z-10">
              <Text className="text-gray-500 text-sm font-inter">Password</Text>
            </View>
            <TextInput 
              className="flex-1 font-inter text-dark text-lg pt-1" 
              placeholder="••••••••••" 
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-2">
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Remember Me & Forgot Password */}
          <View className="flex-row items-center justify-between mt-5">
            <TouchableOpacity 
              className="flex-row items-center" 
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View className={`w-5 h-5 rounded items-center justify-center mr-2 border ${rememberMe ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text className="text-dark font-inter text-base">Remember me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity>
              <Text className="text-secondary font-inter text-base">Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            className="bg-primary rounded-xl py-4 mt-8 items-center shadow-sm shadow-primary/30"
            activeOpacity={0.8}
            onPress={() => router.replace('/(tabs)' as any)}
          >
            <Text className="text-white font-poppins text-lg">Login</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mt-8 mb-6">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="text-gray-400 font-inter px-4 text-base">or continue with</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          {/* Google Button */}
          <TouchableOpacity 
            className="border border-gray-300 rounded-xl py-3.5 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            <Image 
              source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}} 
              className="w-6 h-6 mr-3" 
            />
            <Text className="text-dark font-poppins text-base pt-0.5">Continue with Google</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View className="flex-row justify-center mt-auto mb-4">
            <Text className="text-gray-500 font-inter text-base">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register' as any)}>
              <Text className="text-primary font-poppins text-base">Register</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
