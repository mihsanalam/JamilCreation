import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Product } from '../../types';
import { database } from '../../db';
import ProductModel from '../../db/models/Product';
import TransactionModel from '../../db/models/Transaction';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { notifyLowStock, notifySaleRecorded } from '../../services/notifications';

type ProductDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
};

export default function ProductDetailsModal({ visible, onClose, product }: ProductDetailsModalProps) {
  const { user } = useAuth();
  const { isOwner } = useRole();
  const [adjustType, setAdjustType] = useState<'add' | 'remove' | 'sell' | null>(null);
  const [adjustQty, setAdjustQty] = useState('');

  if (!product) return null;

  const handleConfirmStockAdjustment = async () => {
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      let isOverStock = false;
      let finalQty = 0;

      await database.write(async () => {
        const productRecord = await database.get<ProductModel>('products').find(product.id);
        
        if (adjustType === 'sell' && qty > productRecord.quantity) {
          isOverStock = true;
          return;
        }

        if (adjustType === 'add') {
          finalQty = productRecord.quantity + qty;
        } else {
          finalQty = Math.max(0, productRecord.quantity - qty);
        }
        
        await productRecord.update(record => {
          record.quantity = finalQty;
        });

        // Record a transaction for this stock change
        await database.get<TransactionModel>('transactions').create((tx: TransactionModel) => {
          tx.product_id = product.id;
          tx.product_name = product.name;
          tx.type = adjustType === 'add' ? 'added' : adjustType === 'sell' ? 'sold' : 'removed';
          tx.quantity = qty;
          tx.note = adjustType === 'add' 
            ? `Stock added (Price: ৳${productRecord.buying_price.toFixed(2)})` 
            : adjustType === 'sell'
            ? `Sale @ ৳${productRecord.selling_price.toFixed(2)}/unit`
            : `Stock removed (Price: ৳${productRecord.selling_price.toFixed(2)})`;
          tx.by_user = user?.email || user?.user_metadata?.full_name || 'Admin';
          tx.business_name = user?.user_metadata?.business_name || undefined;
        });
      });

      if (isOverStock) {
        Alert.alert('Insufficient Stock', `Only ${product.quantity} units available.`);
        return;
      }

      // Trigger alerts/notifications
      if (adjustType === 'sell') {
        const revenue = product.sellingPrice * qty;
        await notifySaleRecorded(product.name, qty, revenue);
      }
      if (finalQty <= 5) {
        await notifyLowStock(product.name, finalQty);
      }

      Alert.alert('Success', `Stock ${adjustType === 'add' ? 'added' : adjustType === 'sell' ? 'sold' : 'removed'} successfully!`);
      setAdjustType(null);
      setAdjustQty('');
      onClose();
    } catch (e) {
      const err = e as Error;
      Alert.alert('Error', 'Failed to update stock: ' + err.message);
    }
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await database.write(async () => {
                const productRecord = await database.get<ProductModel>('products').find(product.id);
                await productRecord.destroyPermanently();
                
                // Add transaction for deletion
                await database.get<TransactionModel>('transactions').create((tx: TransactionModel) => {
                  tx.product_id = product.id;
                  tx.product_name = product.name;
                  tx.type = 'removed';
                  tx.quantity = product.quantity;
                  tx.note = 'Product deleted permanently';
                  tx.by_user = user?.email || user?.user_metadata?.full_name || 'Admin';
                  tx.business_name = user?.user_metadata?.business_name || undefined;
                });
              });
              Alert.alert('Success', 'Product deleted successfully!');
              onClose();
            } catch (e) {
              const err = e as Error;
              Alert.alert('Error', 'Failed to delete product: ' + err.message);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          className="bg-white rounded-t-[36px] max-h-[90%] w-full"
          onStartShouldSetResponder={() => true}
        >
          {/* Drag handle */}
          <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center my-3" />
          
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pb-4 border-b border-gray-100">
            <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center -ml-2">
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text className="text-dark font-poppins text-lg font-bold">Product Details</Text>
            <TouchableOpacity 
              onPress={() => {
                onClose();
                router.push({ pathname: '/product/add', params: { id: product.id } });
              }} 
              className="w-10 h-10 items-center justify-center -mr-2"
            >
              <Ionicons name="create-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
            {/* Image Section */}
            <View className="bg-white items-center py-4 relative">
              <Image 
                source={{ uri: product.imageUrl || 'https://cdn-icons-png.flaticon.com/512/1174/1174408.png' }} 
                className="w-40 h-40 rounded-2xl"
                resizeMode="cover"
              />
            </View>

            {/* Title & Badges */}
            <View className="mt-4">
              <View className="flex-row items-center mb-1">
                <Text className="text-dark font-poppins text-2xl mr-3 flex-shrink-1 font-semibold">{product.name}</Text>
                <View className={`px-2.5 py-0.5 rounded-md ${product.quantity > 5 ? 'bg-primary/10' : 'bg-warning/10'}`}>
                  <Text className={`font-inter text-[10px] font-semibold ${product.quantity > 5 ? 'text-primary' : 'text-warning'}`}>
                    {product.quantity > 5 ? 'In Stock' : 'Low Stock'}
                  </Text>
                </View>
              </View>
              
              <View className="flex-row justify-between items-center mb-6 mt-1">
                <Text className="text-gray-400 font-inter text-xs">SKU: <Text className="text-dark font-medium">{product.sku}</Text></Text>
                <Text className="text-gray-400 font-inter text-xs">Category: <Text className="text-dark font-medium">{product.category}</Text></Text>
              </View>

              {/* Product Information Card */}
              <View className="bg-[#F8FAFC] border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm shadow-gray-200/30">
                <Text className="text-dark font-poppins text-sm font-semibold mb-4">Stock Information</Text>
                
                <View className="flex-row justify-between mb-3.5">
                  <Text className="text-gray-400 font-inter text-sm">Quantity</Text>
                  <Text className="text-dark font-poppins font-medium text-sm">{product.quantity} units</Text>
                </View>
                
                <View className="w-full h-[1px] bg-gray-100 mb-3.5" />
                
                <View className="flex-row justify-between mb-3.5">
                  <Text className="text-gray-400 font-inter text-sm">Buying Price</Text>
                  <Text className="text-dark font-poppins font-medium text-sm">৳{product.buyingPrice.toFixed(2)}</Text>
                </View>
                
                <View className="w-full h-[1px] bg-gray-100 mb-3.5" />
                
                <View className="flex-row justify-between mb-3.5">
                  <Text className="text-gray-400 font-inter text-sm">Selling Price</Text>
                  <Text className="text-dark font-poppins font-medium text-sm">৳{product.sellingPrice.toFixed(2)}</Text>
                </View>
                
                <View className="w-full h-[1px] bg-gray-100 mb-3.5" />
                
                <View className="flex-row justify-between">
                  <Text className="text-gray-400 font-inter text-sm">Supplier</Text>
                  <Text className="text-dark font-inter font-medium text-sm">{product.supplier || 'N/A'}</Text>
                </View>
              </View>
            </View>
            
            <View className="h-10" />
          </ScrollView>

          {/* Stock Adjustment Inline Form */}
          {adjustType && (
            <View className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <Text className="text-dark font-poppins text-sm font-semibold mb-2">
                {adjustType === 'add' ? 'Add Stock' : adjustType === 'sell' ? 'Record Sale' : 'Remove Stock'}
              </Text>
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 font-inter text-dark mr-3 shadow-sm shadow-gray-200/20"
                  placeholder="Enter quantity"
                  keyboardType="numeric"
                  value={adjustQty}
                  onChangeText={setAdjustQty}
                  autoFocus
                />
                <TouchableOpacity 
                  className={`rounded-2xl px-5 py-3.5 ${adjustType === 'sell' ? 'bg-[#3B82F6]' : adjustType === 'add' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                  onPress={handleConfirmStockAdjustment}
                >
                  <Text className="text-white font-poppins font-semibold text-xs">Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="ml-2 rounded-2xl px-4 py-3.5 border border-gray-200 bg-white"
                  onPress={() => {
                    setAdjustType(null);
                    setAdjustQty('');
                  }}
                >
                  <Text className="text-gray-500 font-inter text-xs">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom Actions */}
          <View className="px-6 py-4 border-t border-gray-100 bg-white flex-row justify-between pb-8" style={{ gap: 8 }}>
            <TouchableOpacity 
              onPress={() => {
                setAdjustType('sell');
                setAdjustQty('');
              }}
              className="bg-[#3B82F6] rounded-2xl py-3.5 px-3 flex-1 items-center flex-row justify-center shadow-md shadow-blue-500/10"
            >
              <Ionicons name="bag-handle-outline" size={18} color="white" />
              <Text className="text-white font-poppins font-semibold text-xs ml-1.5">Sell</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setAdjustType('add');
                setAdjustQty('');
              }}
              className="bg-[#10B981]/10 rounded-2xl py-3.5 px-3 flex-1 items-center flex-row justify-center"
            >
              <Ionicons name="add-circle-outline" size={18} color="#10B981" />
              <Text className="text-[#10B981] font-poppins font-semibold text-xs ml-1.5">Add Stock</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                setAdjustType('remove');
                setAdjustQty('');
              }}
              className="bg-[#EF4444]/10 rounded-2xl py-3.5 px-3 flex-1 items-center flex-row justify-center"
            >
              <Ionicons name="remove-circle-outline" size={18} color="#EF4444" />
              <Text className="text-[#EF4444] font-poppins font-semibold text-xs ml-1.5">Remove</Text>
            </TouchableOpacity>
            
            {isOwner && (
            <TouchableOpacity 
              onPress={handleDeleteProduct}
              className="bg-red-50 rounded-2xl p-3.5 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
