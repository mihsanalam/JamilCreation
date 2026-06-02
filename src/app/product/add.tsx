import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function AddProductScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <View className="px-5 pt-4 pb-4 flex-row items-center border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-dark font-poppins text-xl">Add New Product</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        
        {/* Product Image */}
        <Text className="text-dark font-inter text-sm mb-3">Product Image</Text>
        <TouchableOpacity 
          onPress={pickImage}
          className="border-2 border-dashed border-gray-300 rounded-3xl h-32 w-48 self-center items-center justify-center bg-gray-50 mb-6 overflow-hidden"
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color="#64748b" className="mb-2" />
              <Text className="text-gray-500 font-inter text-sm">Upload Image</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Product Name */}
        <View className="mb-4">
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2">
            <Text className="text-dark font-poppins text-xs mb-1">Product Name</Text>
            <TextInput 
              className="font-inter text-dark text-sm p-0"
              placeholder="Enter product name"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* SKU */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 mr-3">
            <Text className="text-dark font-poppins text-xs mb-1">SKU</Text>
            <TextInput 
              className="font-inter text-dark text-sm p-0"
              placeholder="Auto-generate"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <TouchableOpacity className="bg-gray-200 w-14 rounded-2xl items-center justify-center">
            <Ionicons name="shuffle-outline" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Barcode */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 mr-3">
            <Text className="text-dark font-poppins text-xs mb-1">Barcode</Text>
            <TextInput 
              className="font-inter text-dark text-sm p-0"
              placeholder="Scan barcode"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <TouchableOpacity className="bg-gray-200 w-14 rounded-2xl items-center justify-center">
            <Ionicons name="barcode-outline" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Category */}
        <View className="mb-4">
          <TouchableOpacity className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex-row justify-between items-center">
            <View>
              <Text className="text-dark font-poppins text-xs mb-1">Category</Text>
              <Text className="text-gray-400 font-inter text-sm">Select category</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View className="mb-4">
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 min-h-[100px]">
            <Text className="text-dark font-poppins text-xs mb-1">Description</Text>
            <TextInput 
              className="font-inter text-dark text-sm p-0"
              placeholder="Enter description"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Pricing & Quantity Row */}
        <View className="flex-row justify-between mb-4">
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 w-[30%]">
            <Text className="text-dark font-poppins text-xs mb-1">Quantity</Text>
            <TextInput 
              className="font-inter text-dark text-sm p-0"
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 w-[32%]">
            <Text className="text-dark font-poppins text-xs mb-1">Buying Price</Text>
            <TextInput 
              className="font-inter text-dark text-sm p-0"
              placeholder="$ 0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
          </View>
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 w-[32%]">
            <Text className="text-dark font-poppins text-xs mb-1">Selling Price</Text>
            <TextInput 
              className="font-inter text-dark text-sm p-0"
              placeholder="$ 0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Supplier */}
        <View className="mb-8">
          <TouchableOpacity className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex-row justify-between items-center">
            <View>
              <Text className="text-dark font-poppins text-xs mb-1">Supplier</Text>
              <Text className="text-gray-400 font-inter text-sm">Select supplier</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity className="bg-[#10B981] rounded-2xl py-4 items-center mb-10 shadow-lg shadow-[#10B981]/30">
          <Text className="text-white font-poppins text-base">Save Product</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
