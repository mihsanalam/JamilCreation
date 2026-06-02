import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav';
import ProductDetailsModal from '../../components/inventory/ProductDetailsModal';
import { Product } from '../../types';

export default function InventoryScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      
      {/* Header & Search */}
      <View className="px-5 pt-4 pb-2">
        <Text className="text-dark font-poppins text-2xl mb-4">Inventory</Text>
        
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm shadow-gray-200/50">
            <Ionicons name="search-outline" size={20} color="#9ca3af" className="mr-2" />
            <TextInput 
              className="flex-1 font-inter text-dark text-base p-0 m-0" 
              placeholder="Search products..." 
              placeholderTextColor="#9ca3af"
            />
          </View>
          <TouchableOpacity className="bg-white border border-gray-100 rounded-full w-12 h-12 items-center justify-center ml-3 shadow-sm shadow-gray-200/50">
            <Ionicons name="filter-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <TouchableOpacity className="bg-primary px-5 py-2 rounded-full mr-2">
            <Text className="text-white font-inter text-sm">All</Text>
          </TouchableOpacity>
          {['Electronics', 'Fashion', 'Furniture', 'Office'].map((category) => (
            <TouchableOpacity key={category} className="bg-white border border-gray-200 px-5 py-2 rounded-full mr-2">
              <Text className="text-gray-500 font-inter text-sm">{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
        
        {/* Product 1 */}
        <TouchableOpacity 
          className="bg-white rounded-3xl p-3 mb-4 flex-row border border-gray-100 shadow-sm shadow-gray-200/50"
          onPress={() => handleProductPress({
            id: '1',
            name: 'JBL Tune 520BT',
            sku: 'JBL-520',
            category: 'Electronics',
            quantity: 42,
            buyingPrice: 45.00,
            sellingPrice: 65.00,
            supplier: 'JBL Electronics',
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/3437/3437364.png'
          })}
        >
          <View className="bg-gray-50 rounded-2xl w-24 h-24 items-center justify-center mr-4">
             <Image 
               source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3437/3437364.png' }} 
               className="w-16 h-16 opacity-80" 
               resizeMode="contain" 
             />
          </View>
          <View className="flex-1 justify-center py-1">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-dark font-poppins text-base">JBL Tune 520BT</Text>
                <Text className="text-gray-400 font-inter text-xs mt-0.5">JBL-520</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-between items-end mt-4">
              <Text className="text-dark font-inter text-sm">Qty: <Text className="font-poppins">42</Text></Text>
              <View className="items-end">
                <View className="bg-primary/10 px-2 py-1 rounded-md mb-1">
                  <Text className="text-primary font-inter text-[10px]">In Stock</Text>
                </View>
                <Text className="text-dark font-poppins text-base">$65.00</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Product 2 */}
        <TouchableOpacity 
          className="bg-white rounded-3xl p-3 mb-4 flex-row border border-gray-100 shadow-sm shadow-gray-200/50"
          onPress={() => handleProductPress({
            id: '2',
            name: 'Logitech MX Master 3S',
            sku: 'LOG-220',
            category: 'Electronics',
            quantity: 8,
            buyingPrice: 85.00,
            sellingPrice: 110.00,
            supplier: 'Logitech Global',
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/3388/3388701.png'
          })}
        >
          <View className="bg-gray-50 rounded-2xl w-24 h-24 items-center justify-center mr-4">
             <Image 
               source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3388/3388701.png' }} 
               className="w-16 h-16 opacity-80" 
               resizeMode="contain" 
             />
          </View>
          <View className="flex-1 justify-center py-1">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-dark font-poppins text-base">Logitech MX Master 3S</Text>
                <Text className="text-gray-400 font-inter text-xs mt-0.5">LOG-220</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-between items-end mt-4">
              <Text className="text-dark font-inter text-sm">Qty: <Text className="font-poppins">8</Text></Text>
              <View className="items-end">
                <View className="bg-warning/10 px-2 py-1 rounded-md mb-1">
                  <Text className="text-warning font-inter text-[10px]">Low Stock</Text>
                </View>
                <Text className="text-dark font-poppins text-base">$110.00</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Product 3 */}
        <TouchableOpacity 
          className="bg-white rounded-3xl p-3 mb-4 flex-row border border-gray-100 shadow-sm shadow-gray-200/50"
          onPress={() => handleProductPress({
            id: '3',
            name: 'Nike Hoodie',
            sku: 'NK-889',
            category: 'Fashion',
            quantity: 15,
            buyingPrice: 25.00,
            sellingPrice: 40.00,
            supplier: 'Nike Direct',
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/863/863684.png'
          })}
        >
          <View className="bg-gray-50 rounded-2xl w-24 h-24 items-center justify-center mr-4">
             <Image 
               source={{ uri: 'https://cdn-icons-png.flaticon.com/512/863/863684.png' }} 
               className="w-16 h-16 opacity-80" 
               resizeMode="contain" 
             />
          </View>
          <View className="flex-1 justify-center py-1">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-dark font-poppins text-base">Nike Hoodie</Text>
                <Text className="text-gray-400 font-inter text-xs mt-0.5">NK-889</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-between items-end mt-4">
              <Text className="text-dark font-inter text-sm">Qty: <Text className="font-poppins">15</Text></Text>
              <View className="items-end">
                <View className="bg-primary/10 px-2 py-1 rounded-md mb-1">
                  <Text className="text-primary font-inter text-[10px]">In Stock</Text>
                </View>
                <Text className="text-dark font-poppins text-base">$40.00</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Extra spacing for FAB and Bottom Bar */}
        <View className="h-28" />
      </ScrollView>

      {/* FAB (Floating Action Button) */}
      <TouchableOpacity 
        className="absolute bottom-24 right-5 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-primary/40 z-10"
        onPress={() => router.push('/product/add' as any)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <BottomNav currentRoute="/inventory" />

      <ProductDetailsModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        product={selectedProduct} 
      />
    </SafeAreaView>
  );
}
