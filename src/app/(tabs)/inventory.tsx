import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNav from '../../components/BottomNav';
import ProductDetailsModal from '../../components/inventory/ProductDetailsModal';
import withObservables from '@nozbe/with-observables';
import { database } from '../../db';
import ProductModel from '../../db/models/Product';
import { Product } from '../../types';
import * as FileSystem from 'expo-file-system/legacy';
// expo-sharing is loaded dynamically to prevent crash when native module isn't in dev client
import { useRole } from '../../hooks/useRole';

// Individual Product Item Component
const ProductItem = React.memo(({ product, onPress }: { product: ProductModel; onPress: (p: Product) => void }) => {
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
          <View className="flex-1 mr-2">
            <Text className="text-dark font-poppins text-base" numberOfLines={1}>{product.name}</Text>
            <Text className="text-gray-400 font-inter text-xs mt-0.5">{product.sku}</Text>
          </View>
        </View>
        <View className="flex-row justify-between items-end mt-4">
          <Text className="text-dark font-inter text-sm">Qty: <Text className="font-poppins">{product.quantity}</Text></Text>
          <View className="items-end">
            <View className={`${isLowStock ? 'bg-warning/10' : 'bg-primary/10'} px-2 py-0.5 rounded-md mb-1`}>
              <Text className={`${isLowStock ? 'text-warning' : 'text-primary'} font-inter text-[10px]`}>
                {isLowStock ? 'Low Stock' : 'In Stock'}
              </Text>
            </View>
            <Text className="text-dark font-poppins text-base">৳{product.selling_price.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// Make the individual item reactive to its own changes (like quantity updates)
const EnhancedProductItem = withObservables(['product'], ({ product }: { product: ProductModel }) => ({
  product,
}))(ProductItem);


// The List Component with memory filtering
const InventoryList = ({ 
  products, 
  searchQuery = '', 
  selectedCategory = 'All', 
  onProductPress,
  onClearFilters
}: { 
  products: ProductModel[]; 
  searchQuery: string;
  selectedCategory: string;
  onProductPress: (p: Product) => void;
  onClearFilters: () => void;
}) => {
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
      {filteredProducts.length === 0 ? (
        products.length === 0 ? (
          <View className="items-center justify-center py-16 px-6 bg-white border border-gray-100 rounded-[32px] mt-6 shadow-sm shadow-gray-200/30">
            <View className="bg-primary/10 w-20 h-20 rounded-full items-center justify-center mb-6">
              <Ionicons name="cube-outline" size={40} color="#6366F1" />
            </View>
            <Text className="text-dark font-poppins text-lg font-bold mb-2 text-center">Your Inventory is Empty</Text>
            <Text className="text-gray-400 font-inter text-sm text-center mb-6 leading-5">
              Start tracking your stock, buying prices, and sales by adding your first product.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/product/add')}
              className="bg-primary px-6 py-3.5 rounded-2xl shadow-lg shadow-primary/20"
            >
              <Text className="text-white font-poppins text-sm font-semibold">Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center justify-center py-16 px-6 bg-white border border-gray-100 rounded-[32px] mt-6 shadow-sm shadow-gray-200/30">
            <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-6">
              <Ionicons name="search-outline" size={40} color="#64748B" />
            </View>
            <Text className="text-dark font-poppins text-lg font-bold mb-2 text-center">No Matches Found</Text>
            <Text className="text-gray-400 font-inter text-sm text-center mb-6 leading-5">
              We couldn't find any products matching your search or category selection. Try resetting filters.
            </Text>
            <TouchableOpacity
              onPress={onClearFilters}
              className="bg-gray-800 px-6 py-3.5 rounded-2xl shadow-lg shadow-gray-800/20"
            >
              <Text className="text-white font-poppins text-sm font-semibold">Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        filteredProducts.map(product => (
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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [productsList, setProductsList] = useState<ProductModel[]>([]);
  const { isOwner } = useRole();

  // Observe products count/list locally to extract categories list dynamically
  React.useEffect(() => {
    const subscription = database.collections.get<ProductModel>('products')
      .query()
      .observe()
      .subscribe(list => {
        setProductsList(list);
      });
    return () => subscription.unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(productsList.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [productsList]);

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  // CSV Exporter
  const exportInventoryToCSV = async () => {
    try {
      if (productsList.length === 0) {
        Alert.alert('Empty Inventory', 'No products available to export.');
        return;
      }

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '';
        let str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const headers = [
        'Product Name',
        'SKU',
        'Barcode',
        'Category',
        'Quantity',
        'Buying Price (৳)',
        'Selling Price (৳)',
        'Stock Value (৳)',
        'Supplier',
        'Warehouse',
        'Location',
        'Low Stock Threshold',
        'Business Name'
      ];

      const rows = productsList.map(p => {
        const stockValue = (p.quantity || 0) * (p.buying_price || 0);
        return [
          escapeCSV(p.name),
          escapeCSV(p.sku),
          escapeCSV(p.barcode),
          escapeCSV(p.category),
          p.quantity || 0,
          p.buying_price || 0,
          p.selling_price || 0,
          stockValue,
          escapeCSV(p.supplier),
          escapeCSV(p.warehouse),
          escapeCSV(p.location),
          p.low_stock_threshold || 0,
          escapeCSV(p.business_name)
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const filename = `inventory_stock_${new Date().toISOString().slice(0, 10)}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Stock Data',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Failed to export inventory CSV:', error);
      Alert.alert('Error', 'Failed to generate CSV file. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      
      {/* Header & Search */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-dark font-poppins text-2xl">Inventory</Text>
          {isOwner && (
          <TouchableOpacity 
            onPress={exportInventoryToCSV}
            className="flex-row items-center bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-2xl active:opacity-80 shadow-sm shadow-emerald-100/50"
          >
            <Ionicons name="download-outline" size={16} color="#10B981" />
            <Text className="text-[#10B981] font-poppins text-xs font-semibold ml-1.5">Export CSV</Text>
          </TouchableOpacity>
          )}
        </View>
        
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row items-center bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm shadow-gray-200/50">
            <Ionicons name="search-outline" size={20} color="#9ca3af" className="mr-2" />
            <TextInput 
              className="flex-1 font-inter text-dark text-base p-0 m-0" 
              placeholder="Search products..." 
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }} 
            className="bg-white border border-gray-100 rounded-full w-12 h-12 items-center justify-center ml-3 shadow-sm shadow-gray-200/50"
          >
            <Ionicons name="refresh-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        {categories.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <TouchableOpacity 
                  key={category} 
                  onPress={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-full mr-2 ${isSelected ? 'bg-primary' : 'bg-white border border-gray-200'}`}
                >
                  <Text className={`font-inter text-sm ${isSelected ? 'text-white' : 'text-gray-500'}`}>{category}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Reactive Product List from WatermelonDB */}
      <EnhancedInventoryList 
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onProductPress={handleProductPress} 
        onClearFilters={() => {
          setSearchQuery('');
          setSelectedCategory('All');
        }}
      />

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
