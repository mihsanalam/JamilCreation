import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../../services/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({}); 

  const handleEmailSignup = async () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
            phone: phone,
            role: 'owner',
            avatar_url: logoBase64 ? `data:image/jpeg;base64,${logoBase64}` : null,
          }
        }
      });

      if (error) throw error;
      setSuccessModalVisible(true);
      
    } catch (e: any) {
      setErrors({ general: e.message || 'Signup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const redirectTo = makeRedirectUri();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        if (result.type === 'success') {
          const { params, errorCode } = QueryParams.getQueryParams(result.url);
          if (errorCode) throw new Error(errorCode);
          
          if (params?.access_token && params?.refresh_token) {
            await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            router.replace('/(tabs)' as any);
          }
        }
      }
    } catch (e: any) {
      alert('Error signing in with Google: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'ios',
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setLogoUri(compressed.uri);
      setLogoBase64(compressed.base64 || null);
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
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center" style={errors.fullName ? { borderColor: '#f87171' } : {}}>
            <Ionicons name="person-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Full Name *</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="Jamil Khan" 
                placeholderTextColor="#9ca3af"
                value={fullName}
                onChangeText={v => { setFullName(v); setErrors(e => ({ ...e, fullName: '' })); }}
              />
            </View>
          </View>
          {errors.fullName ? <Text className="text-red-500 font-inter text-xs mt-1 ml-2">{errors.fullName}</Text> : null}

          {/* Business Name */}
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center">
            <Ionicons name="business-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Business Name</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="Jamil Creation" 
                placeholderTextColor="#9ca3af"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>
          </View>

          {/* Email Address */}
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center" style={errors.email ? { borderColor: '#f87171' } : {}}>
            <Ionicons name="mail-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Email Address *</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="jamilbusiness@gmail.com" 
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={v => { setEmail(v); setErrors(e => ({ ...e, email: '' })); }}
              />
            </View>
          </View>
          {errors.email ? <Text className="text-red-500 font-inter text-xs mt-1 ml-2">{errors.email}</Text> : null}

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
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Password */}
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center" style={errors.password ? { borderColor: '#f87171' } : {}}>
            <Ionicons name="lock-closed-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Password * (min 6 chars)</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="••••••••••" 
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={v => { setPassword(v); setErrors(e => ({ ...e, password: '' })); }}
              />
            </View>
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text className="text-red-500 font-inter text-xs mt-1 ml-2">{errors.password}</Text> : null}

          {/* Confirm Password */}
          <View className="border border-gray-200 bg-[#F8FAFC] rounded-2xl px-4 py-2 mt-4 flex-row items-center" style={errors.confirmPassword ? { borderColor: '#f87171' } : {}}>
            <Ionicons name="lock-closed-outline" size={22} color="#6b7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-500 text-xs font-inter">Confirm Password *</Text>
              <TextInput 
                className="font-inter text-dark text-base p-0 m-0" 
                placeholder="••••••••••" 
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={v => { setConfirmPassword(v); setErrors(e => ({ ...e, confirmPassword: '' })); }}
              />
            </View>
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? <Text className="text-red-500 font-inter text-xs mt-1 ml-2">{errors.confirmPassword}</Text> : null}
          {errors.general ? (
            <View className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-4">
              <Text className="text-red-500 font-inter text-sm">{errors.general}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            className="bg-primary rounded-xl py-4 mt-8 items-center shadow-sm shadow-primary/30"
            activeOpacity={0.8}
            onPress={handleEmailSignup}
            disabled={loading}
          >
            <Text className="text-white font-poppins text-lg">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mt-6 mb-6">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="text-gray-400 font-inter px-4 text-base">or continue with</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          {/* Google Button */}
          <TouchableOpacity 
            className="border border-gray-300 rounded-xl py-3.5 flex-row items-center justify-center mb-6"
            activeOpacity={0.7}
            onPress={handleGoogleSignup}
            disabled={loading}
          >
            <Image 
              source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}} 
              className="w-6 h-6 mr-3" 
            />
            <Text className="text-dark font-poppins text-base pt-0.5">
              {loading ? 'Connecting...' : 'Sign up with Google'}
            </Text>
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

      {/* Verify Email Success Modal */}
      <Modal
        visible={successModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setSuccessModalVisible(false);
          router.replace('/login' as any);
        }}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white rounded-[32px] p-6 w-full max-w-sm items-center shadow-2xl border border-gray-100">
            {/* Icon Wrapper */}
            <View className="w-20 h-20 bg-purple-50 rounded-full items-center justify-center mb-6">
              <Ionicons name="mail-unread-outline" size={42} color="#8B5CF6" />
            </View>

            {/* Typography */}
            <Text className="text-dark font-poppins text-2xl text-center mb-3">Verify Your Email</Text>
            <Text className="text-gray-500 font-inter text-sm text-center leading-6 mb-8 px-2">
              We've sent a verification link to <Text className="font-semibold text-dark">{email.toLowerCase()}</Text>.{"\n"}
              Please check your inbox (and spam/junk folder) to verify and activate your account.
            </Text>

            {/* Action Buttons */}
            <TouchableOpacity
              onPress={() => {
                setSuccessModalVisible(false);
                router.replace('/login' as any);
              }}
              className="w-full bg-[#0F172A] rounded-2xl py-4 items-center shadow-md shadow-[#0F172A]/20"
              activeOpacity={0.8}
            >
              <Text className="text-white font-poppins text-base font-semibold">Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
