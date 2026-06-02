import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';

type ProductDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
};

export default function ProductDetailsModal({ visible, onClose, product }: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center -ml-2">
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-dark font-poppins text-lg">Product Details</Text>
          <TouchableOpacity className="w-10 h-10 items-center justify-center -mr-2">
            <Ionicons name="create-outline" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Image Section */}
          <View className="bg-white items-center py-8 relative">
            <Image 
              source={{ uri: product.imageUrl || 'https://cdn-icons-png.flaticon.com/512/3437/3437364.png' }} 
              className="w-48 h-48"
              resizeMode="contain"
            />
            {/* Mock slider navigation button */}
            <TouchableOpacity className="absolute right-6 top-28 bg-gray-100 w-8 h-8 rounded-full items-center justify-center shadow-sm">
              <Ionicons name="chevron-forward" size={16} color="#6b7280" />
            </TouchableOpacity>
            
            {/* Pagination dots */}
            <View className="flex-row mt-6">
              <View className="w-2 h-2 rounded-full bg-primary mx-1" />
              <View className="w-2 h-2 rounded-full bg-gray-200 mx-1" />
              <View className="w-2 h-2 rounded-full bg-gray-200 mx-1" />
              <View className="w-2 h-2 rounded-full bg-gray-200 mx-1" />
              <View className="w-2 h-2 rounded-full bg-gray-200 mx-1" />
            </View>
          </View>

          {/* Title & Badges */}
          <View className="px-5 mt-4">
            <View className="flex-row items-center mb-1">
              <Text className="text-dark font-poppins text-2xl mr-3 flex-shrink-1">{product.name}</Text>
              <View className={`px-2 py-1 rounded-md ${product.quantity > 10 ? 'bg-primary/10' : 'bg-warning/10'}`}>
                <Text className={`font-inter text-[10px] ${product.quantity > 10 ? 'text-primary' : 'text-warning'}`}>
                  {product.quantity > 10 ? 'In Stock' : 'Low Stock'}
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-gray-500 font-inter text-sm">SKU: <Text className="text-dark">{product.sku}</Text></Text>
              <Text className="text-gray-500 font-inter text-sm">Category: <Text className="text-dark">{product.category}</Text></Text>
            </View>

            {/* Product Information Card */}
            <View className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-5 mb-8">
              <Text className="text-dark font-poppins text-base mb-4">Product Information</Text>
              
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500 font-inter text-sm">Quantity</Text>
                <Text className="text-dark font-inter font-medium text-sm">{product.quantity}</Text>
              </View>
              
              <View className="w-full h-[1px] bg-gray-200 mb-3" />
              
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500 font-inter text-sm">Buying Price</Text>
                <Text className="text-dark font-inter font-medium text-sm">${product.buyingPrice.toFixed(2)}</Text>
              </View>
              
              <View className="w-full h-[1px] bg-gray-200 mb-3" />
              
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500 font-inter text-sm">Selling Price</Text>
                <Text className="text-dark font-inter font-medium text-sm">${product.sellingPrice.toFixed(2)}</Text>
              </View>
              
              <View className="w-full h-[1px] bg-gray-200 mb-3" />
              
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500 font-inter text-sm">Supplier</Text>
                <Text className="text-dark font-inter font-medium text-sm">{product.supplier || 'N/A'}</Text>
              </View>
              
              <View className="w-full h-[1px] bg-gray-200 mb-3" />
              
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500 font-inter text-sm">Warehouse</Text>
                <Text className="text-dark font-inter font-medium text-sm">Main Warehouse</Text>
              </View>
              
              <View className="w-full h-[1px] bg-gray-200 mb-3" />
              
              <View className="flex-row justify-between">
                <Text className="text-gray-500 font-inter text-sm">Location</Text>
                <Text className="text-dark font-inter font-medium text-sm">Shelf A-12</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View className="px-5 py-4 border-t border-gray-100 bg-white flex-row justify-between pb-8">
          <TouchableOpacity className="bg-[#10B981]/10 rounded-xl py-3 px-3 flex-1 mr-2 items-center flex-row justify-center">
            <Ionicons name="add-circle-outline" size={18} color="#10B981" />
            <Text className="text-[#10B981] font-inter font-medium text-xs ml-1">Add Stock</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-[#EF4444]/10 rounded-xl py-3 px-1 flex-1 mr-2 items-center flex-row justify-center">
            <Ionicons name="remove-circle-outline" size={18} color="#EF4444" />
            <Text className="text-[#EF4444] font-inter font-medium text-[10px] ml-1">Remove Stock</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-[#3B82F6]/10 rounded-xl py-3 px-2 flex-1 mr-2 items-center flex-row justify-center">
            <Ionicons name="create-outline" size={18} color="#3B82F6" />
            <Text className="text-[#3B82F6] font-inter font-medium text-xs ml-1">Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-[#EF4444]/10 rounded-xl py-3 px-2 flex-1 items-center flex-row justify-center">
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text className="text-[#EF4444] font-inter font-medium text-xs ml-1">Delete</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
