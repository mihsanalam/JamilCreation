import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { database } from '../../db';
import ProductModel from '../../db/models/Product';
import TransactionModel from '../../db/models/Transaction';
import { useAuth } from '../../hooks/useAuth';
import { notifyLowStock, notifySaleRecorded } from '../../services/notifications';

export default function RecordSaleScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductModel | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);

  const [qty, setQty] = useState('1');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── Load products once ─────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const all = await database.collections.get<ProductModel>('products').query().fetch();
      setProducts(all);
    };
    load();
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const parsedQty = parseInt(qty, 10) || 0;
  const revenue = selectedProduct ? selectedProduct.selling_price * parsedQty : 0;
  const cost = selectedProduct ? selectedProduct.buying_price * parsedQty : 0;
  const profit = revenue - cost;
  const isOverStock = selectedProduct ? parsedQty > selectedProduct.quantity : false;

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSell = async () => {
    if (!selectedProduct) {
      Alert.alert('Missing Product', 'Please select a product to sell.');
      return;
    }
    if (parsedQty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a quantity greater than 0.');
      return;
    }
    if (isOverStock) {
      Alert.alert('Insufficient Stock', `Only ${selectedProduct.quantity} units available.`);
      return;
    }

    try {
      setIsSaving(true);

      const remainingQty = selectedProduct.quantity - parsedQty;

      await database.write(async () => {
        // 1. Decrement product stock
        await selectedProduct.update((p: any) => {
          p.quantity = remainingQty;
        });

        // 2. Create a 'sold' transaction
        await database.collections.get<TransactionModel>('transactions').create((tx: any) => {
          tx.product_id = selectedProduct.id;
          tx.product_name = selectedProduct.name;
          tx.type = 'sold';
          tx.quantity = parsedQty;
          tx.note = note.trim() || `Sale @ ৳${selectedProduct.selling_price.toFixed(2)}/unit`;
          tx.by_user = user?.email || user?.user_metadata?.full_name || 'Admin';
          tx.created_at = Date.now();
        });
      });

      // 3. Trigger local notifications
      await notifySaleRecorded(selectedProduct.name, parsedQty, revenue);
      if (remainingQty <= selectedProduct.low_stock_threshold) {
        await notifyLowStock(selectedProduct.name, remainingQty);
      }

      Alert.alert(
        'Sale Recorded ✅',
        `${parsedQty} × ${selectedProduct.name}\nRevenue: ৳${revenue.toFixed(2)} | Profit: ৳${profit.toFixed(2)}`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View className="px-5 pt-4 pb-4 flex-row items-center border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View>
          <Text className="text-dark font-poppins text-xl">Record Sale</Text>
          <Text className="text-gray-400 font-inter text-xs">Decrease stock by selling</Text>
        </View>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListEmptyComponent={null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="px-5 pt-6">

            {/* ── Product Picker ───────────────────────────────────────── */}
            <Text className="text-dark font-inter text-sm mb-2">Product *</Text>
            <TouchableOpacity
              onPress={() => setShowProductPicker(true)}
              className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex-row justify-between items-center mb-5 shadow-sm shadow-gray-200/40"
            >
              <View className="flex-1 mr-2">
                {selectedProduct ? (
                  <>
                    <Text className="text-dark font-poppins text-base" numberOfLines={1}>
                      {selectedProduct.name}
                    </Text>
                    <Text className="text-gray-400 font-inter text-xs mt-0.5">
                      SKU: {selectedProduct.sku} · Stock: {selectedProduct.quantity} units
                    </Text>
                  </>
                ) : (
                  <Text className="text-gray-400 font-inter text-base">Tap to choose a product…</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>

            {/* ── Quantity ─────────────────────────────────────────────── */}
            <Text className="text-dark font-inter text-sm mb-2">Quantity Sold *</Text>
            <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex-row items-center mb-2 shadow-sm shadow-gray-200/40">
              {/* Minus */}
              <TouchableOpacity
                onPress={() => setQty(q => String(Math.max(1, (parseInt(q, 10) || 1) - 1)))}
                className="bg-gray-100 w-9 h-9 rounded-xl items-center justify-center"
              >
                <Ionicons name="remove" size={18} color="#0F172A" />
              </TouchableOpacity>

              <TextInput
                className="flex-1 text-center font-poppins text-dark text-xl"
                value={qty}
                onChangeText={v => setQty(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />

              {/* Plus */}
              <TouchableOpacity
                onPress={() => setQty(q => String((parseInt(q, 10) || 0) + 1))}
                className="bg-gray-100 w-9 h-9 rounded-xl items-center justify-center"
              >
                <Ionicons name="add" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Over-stock warning */}
            {isOverStock && (
              <View className="flex-row items-center bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                <Ionicons name="warning-outline" size={16} color="#EF4444" />
                <Text className="text-red-500 font-inter text-xs ml-2">
                  Exceeds available stock ({selectedProduct?.quantity} units)
                </Text>
              </View>
            )}

            {/* ── Note ─────────────────────────────────────────────────── */}
            <Text className="text-dark font-inter text-sm mt-3 mb-2">Note (optional)</Text>
            <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-6 shadow-sm shadow-gray-200/40">
              <TextInput
                className="font-inter text-dark text-sm min-h-[60px]"
                placeholder="e.g. Cash sale, Invoice #123…"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* ── Summary Card ─────────────────────────────────────────── */}
            {selectedProduct && parsedQty > 0 && (
              <View className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm shadow-gray-200/40">
                <Text className="text-dark font-poppins text-base mb-4">Sale Summary</Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500 font-inter text-sm">Unit Price</Text>
                  <Text className="text-dark font-inter text-sm">৳{selectedProduct.selling_price.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500 font-inter text-sm">Quantity</Text>
                  <Text className="text-dark font-inter text-sm">× {parsedQty}</Text>
                </View>
                <View className="h-px bg-gray-100 my-3" />
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500 font-inter text-sm">Revenue</Text>
                  <Text className="text-blue-500 font-poppins text-sm">৳{revenue.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 font-inter text-sm">Profit</Text>
                  <Text className={`font-poppins text-sm ${profit >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                    ৳{profit.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Confirm Button ───────────────────────────────────────── */}
            <TouchableOpacity
              onPress={handleSell}
              disabled={isSaving || !selectedProduct || parsedQty <= 0 || isOverStock}
              className={`rounded-2xl py-4 items-center mb-10 shadow-lg ${
                isSaving || !selectedProduct || parsedQty <= 0 || isOverStock
                  ? 'bg-gray-300 shadow-gray-300/30'
                  : 'bg-[#10B981] shadow-[#10B981]/30'
              }`}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-poppins text-base">Confirm Sale</Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── Product Picker Modal ─────────────────────────────────────────── */}
      <Modal
        visible={showProductPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductPicker(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowProductPicker(false)}
        >
          <View className="bg-white rounded-t-3xl max-h-[80%] p-5">
            {/* Modal header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-dark font-poppins text-lg">Select Product</Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 mb-4">
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-2 font-inter text-dark text-sm p-0"
                placeholder="Search products…"
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Product list */}
            <FlatList
              data={filteredProducts}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="items-center py-10">
                  <Ionicons name="cube-outline" size={40} color="#e2e8f0" />
                  <Text className="text-gray-300 font-inter text-sm mt-2">No products found</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedProduct?.id === item.id;
                const isOut = item.quantity === 0;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedProduct(item);
                      setShowProductPicker(false);
                      setSearch('');
                    }}
                    disabled={isOut}
                    className={`flex-row items-center justify-between py-3.5 border-b border-gray-50 ${isOut ? 'opacity-40' : ''}`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className={`font-poppins text-base ${isSelected ? 'text-[#10B981]' : 'text-dark'}`}>
                        {item.name}
                      </Text>
                      <Text className="text-gray-400 font-inter text-xs mt-0.5">
                        {item.sku} · ৳{item.selling_price.toFixed(2)}/unit
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-lg ${isOut ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <Text className={`font-inter text-xs ${isOut ? 'text-red-400' : 'text-gray-500'}`}>
                        {isOut ? 'Out of stock' : `${item.quantity} left`}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#10B981" className="ml-2" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
