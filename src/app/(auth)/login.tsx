import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../../services/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const [require2FA, setRequire2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  const handleGoogleLogin = async () => {
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
          // Parse the deep link URL to extract tokens
          const { params, errorCode } = QueryParams.getQueryParams(result.url);
          if (errorCode) throw new Error(errorCode);
          
          if (params?.access_token && params?.refresh_token) {
            await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            // Session is set! We can now redirect to dashboard
            router.replace('/(tabs)' as any);
          }
        }
      }
    } catch (e: any) {
      console.error('OAuth error', e);
      alert('Error signing in with Google: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaError) throw mfaError;

      if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
        setRequire2FA(true);
      } else {
        router.replace('/(tabs)' as any);
      }
      
    } catch (e: any) {
      setErrors({ general: e.message || 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!totpCode || totpCode.length < 6) return;
    
    try {
      setLoading(true);
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const totpFactor = factors.data.totp[0];
      if (!totpFactor) throw new Error('No 2FA device found for this account.');

      const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.data.id,
        code: totpCode,
      });

      if (verify.error) throw verify.error;

      router.replace('/(tabs)' as any);
    } catch (e: any) {
      alert('Verification failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (require2FA) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center px-6">
        <Text className="text-3xl font-poppins text-dark text-center">Two-Factor Auth</Text>
        <Text className="text-gray-500 font-inter mt-2 mb-8 text-center text-base">Enter the 6-digit code from your authenticator app</Text>
        
        <View className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center mb-6">
          <Ionicons name="keypad-outline" size={24} color="#6b7280" className="mr-3" />
          <TextInput 
            className="flex-1 font-poppins text-dark text-2xl tracking-[0.5em] text-center" 
            placeholder="000000" 
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            maxLength={6}
            value={totpCode}
            onChangeText={setTotpCode}
          />
        </View>

        <TouchableOpacity 
          className="bg-primary rounded-xl py-4 items-center shadow-sm shadow-primary/30"
          activeOpacity={0.8}
          onPress={handleVerify2FA}
          disabled={loading}
        >
          <Text className="text-white font-poppins text-lg">
            {loading ? 'Verifying...' : 'Verify Code'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setRequire2FA(false)} className="mt-6 items-center">
          <Text className="text-gray-500 font-inter text-base">Back to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
          <View className="mt-4">
            <View className={`relative border rounded-xl px-4 py-3 flex-row items-center ${errors.email ? 'border-red-400' : 'border-gray-300'}`}>
              <View className="absolute -top-2.5 left-3 bg-white px-1 z-10">
                <Text className="text-gray-500 text-sm font-inter">Email Address</Text>
              </View>
              <TextInput 
                className="flex-1 font-inter text-dark text-lg pt-1" 
                placeholder="jamilbusiness@gmail.com" 
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={v => { setEmail(v); setErrors(e => ({ ...e, email: undefined })); }}
              />
            </View>
            {errors.email && <Text className="text-red-500 font-inter text-xs mt-1 ml-1">{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View className="mt-6">
            <View className={`relative border rounded-xl px-4 py-3 flex-row items-center ${errors.password ? 'border-red-400' : 'border-gray-300'}`}>
              <View className="absolute -top-2.5 left-3 bg-white px-1 z-10">
                <Text className="text-gray-500 text-sm font-inter">Password</Text>
              </View>
              <TextInput 
                className="flex-1 font-inter text-dark text-lg pt-1" 
                placeholder="••••••••••" 
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={v => { setPassword(v); setErrors(e => ({ ...e, password: undefined })); }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-2">
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text className="text-red-500 font-inter text-xs mt-1 ml-1">{errors.password}</Text>}
          </View>
          {errors.general && (
            <View className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-4">
              <Text className="text-red-500 font-inter text-sm">{errors.general}</Text>
            </View>
          )}

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
            onPress={handleEmailLogin}
            disabled={loading}
          >
            <Text className="text-white font-poppins text-lg">
              {loading ? 'Logging in...' : 'Login'}
            </Text>
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
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Image 
              source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}} 
              className="w-6 h-6 mr-3" 
            />
            <Text className="text-dark font-poppins text-base pt-0.5">
              {loading ? 'Connecting...' : 'Continue with Google'}
            </Text>
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
