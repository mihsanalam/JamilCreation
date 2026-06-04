import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav';
import ProductDetailsModal from '../../components/inventory/ProductDetailsModal';
import withObservables from '@nozbe/with-observables';
import { database } from '../../db';
import ProductModel from '../../db/models/Product';
import { Product } from '../../types'; // Using this for the modal type compat for now

// Individual Product Item Component
const ProductItem = ({ product, onPress }: { product: ProductModel; onPress: (p: Product) => void }) => {
  // Convert WatermelonDB model to the UI type expected by the modal
  const handlePress = () => {
    onPress({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      quantity: product.quantity,
      buyingPrice: product.buying_price,
      sellingPrice: product.selling_price,
      supplier: product.supplier || 'Unknown',
      imageUrl: product.image_url || 'https://cdn-icons-png.flaticon.com/512/1174/1174408.png',
    });
  };

  const isLowStock = product.quantity <= product.low_stock_threshold;

  return (
    <TouchableOpacity 
      className="bg-white rounded-3xl p-3 mb-4 flex-row border border-gray-100 shadow-sm shadow-gray-200/50"
      onPress={handlePress}
    >
      <View className="bg-gray-50 rounded-2xl w-24 h-24 items-center justify-center mr-4 overflow-hidden">
        <Image 
          source={{ uri: product.image_url || 'https://cdn-icons-png.flaticon.com/512/1174/1174408.png' }} 
          className="w-full h-full opacity-80" 
          resizeMode="cover" 
        />
      </View>
      <View className="flex-1 justify-center py-1">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-dark font-poppins text-base">{product.name}</Text>
            <Text className="text-gray-400 font-inter text-xs mt-0.5">{product.sku}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        <View className="flex-row justify-between items-end mt-4">
          <Text className="text-dark font-inter text-sm">Qty: <Text className="font-poppins">{product.quantity}</Text></Text>
          <View className="items-end">
            <View className={`${isLowStock ? 'bg-warning/10' : 'bg-primary/10'} px-2 py-1 rounded-md mb-1`}>
              <Text className={`${isLowStock ? 'text-warning' : 'text-primary'} font-inter text-[10px]`}>
                {isLowStock ? 'Low Stock' : 'In Stock'}
              </Text>
            </View>
            <Text className="text-dark font-poppins text-base">${product.selling_price.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Make the individual item reactive to its own changes (like quantity updates)
const EnhancedProductItem = withObservables(['product'], ({ product }) => ({
  product,
}))(ProductItem);


// The List Component
const InventoryList = ({ products, onProductPress }: { products: ProductModel[]; onProductPress: (p: Product) => void }) => {
  return (
    <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
      {products.length === 0 ? (
        <View className="items-center justify-center mt-20">
          <Ionicons name="cube-outline" size={64} color="#e5e7eb" />
          <Text className="text-gray-400 font-inter mt-4">No products found in inventory.</Text>
        </View>
      ) : (
        products.map(product => (
          <EnhancedProductItem key={product.id} product={product} onPress={onProductPress} />
        ))
      )}
      <View className="h-28" />
    </ScrollView>
  );
};

// Make the list reactive to new products being inserted or deleted
const EnhancedInventoryList = withObservables([], () => ({
  products: database.collections.get<ProductModel>('products').query(),
}))(InventoryList);


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

      {/* Reactive Product List from WatermelonDB */}
      <EnhancedInventoryList onProductPress={handleProductPress} />

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
