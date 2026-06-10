import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNav from '../../components/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import withObservables from '@nozbe/with-observables';
import { database } from '../../db';
import { Q } from '@nozbe/watermelondb';
import TransactionModel from '../../db/models/Transaction';
import ProductModel from '../../db/models/Product';
import { CartesianChart, Line } from 'victory-native';
import { countTransactionsToday } from '../../utils/inventory';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

function HomeScreen({
  products = [],
  lowStockProducts = [],
  recentTransactions = [],
  allTransactions = []
}: {
  products?: ProductModel[];
  lowStockProducts?: ProductModel[];
  recentTransactions?: TransactionModel[];
  allTransactions?: TransactionModel[];
}) {
  const { user } = useAuth();
  const { isOwner } = useRole();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Guest';
  const avatarUrl = user?.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + firstName;

  const productsCount = products.length;
  const lowStockCount = lowStockProducts.length;

  // Calculate Total Sales
  const totalSales = useMemo(() => {
    const productMap = new Map<string, ProductModel>();
    products.forEach(p => productMap.set(p.id, p));

    return allTransactions
      .filter(tx => tx.type === 'sold')
      .reduce((sum, tx) => {
        const product = productMap.get(tx.product_id);
        let price = product ? product.selling_price : 0;
        if (price === 0 && tx.note) {
          // Fallback: parse price from note
          const match = tx.note.match(/(?:\$|৳)\s*([0-9.]+)/);
          if (match) price = parseFloat(match[1]);
        }
        return sum + (price * tx.quantity);
      }, 0);
  }, [allTransactions, products]);

  // Calculate Transactions Today
  const transactionsToday = useMemo(() => {
    const formattedTx = allTransactions.map(tx => ({
      product_id: tx.product_id,
      product_name: tx.product_name,
      type: tx.type as 'added' | 'sold' | 'removed' | 'returned',
      quantity: tx.quantity || 0,
      createdAt: tx.createdAt instanceof Date ? tx.createdAt.getTime() : Number(tx.createdAt),
    }));

    return countTransactionsToday(formattedTx);
  }, [allTransactions]);

  // Calculate Stock Chart Data
  const stockChartData = useMemo(() => {
    const daysCount = 7;
    const data: {
      dayIndex: number;
      label: string;
      added: number;
      removed: number;
      timestampStart: number;
      timestampEnd: number;
    }[] = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const label = d.toLocaleDateString([], { weekday: 'short' }); // Mon, Tue...

      data.push({
        dayIndex: daysCount - 1 - i,
        label,
        added: 0,
        removed: 0,
        timestampStart: d.getTime(),
        timestampEnd: d.getTime() + 24 * 60 * 60 * 1000 - 1,
      });
    }

    allTransactions.forEach(tx => {
      const txTime = tx.createdAt instanceof Date ? tx.createdAt.getTime() : Number(tx.createdAt);
      const bucket = data.find(b => txTime >= b.timestampStart && txTime <= b.timestampEnd);
      if (bucket) {
        if (tx.type === 'added') {
          bucket.added += tx.quantity;
        } else if (tx.type === 'sold' || tx.type === 'removed') {
          bucket.removed += tx.quantity;
        }
      }
    });

    return data;
  }, [allTransactions]);

  const hasStockData = stockChartData.some(d => d.added > 0 || d.removed > 0);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-500 font-inter text-base">Good Morning,</Text>
            <Text className="text-dark font-poppins text-2xl mt-1">{firstName} 👋</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => setShowNotifications(true)} className="relative mr-4">
              <Ionicons name="notifications-outline" size={28} color="#0F172A" />
              {lowStockCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-danger w-5 h-5 rounded-full items-center justify-center border-2 border-white">
                  <Text className="text-white text-[10px] font-bold">{lowStockCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Image
                source={{ uri: avatarUrl }}
                className="w-12 h-12 rounded-full"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview Card */}
        <View className="bg-primary rounded-3xl p-5 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-poppins text-lg">Overview</Text>
            <View className="flex-row items-center bg-white/10 px-3 py-1 rounded-xl">
              <Text className="text-white/90 font-inter text-xs">Active Store</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {/* Stat Box 1 */}
            <View className="bg-white rounded-2xl p-4 w-[48%] mb-3">
              <Text className="text-gray-500 font-inter text-xs mb-2">Total Products</Text>
              <View className="flex-row justify-between items-end">
                <Text className="text-dark font-poppins text-xl">{productsCount}</Text>
                <View className="bg-emerald-50 p-2 rounded-xl">
                  <Ionicons name="cube-outline" size={20} color="#10B981" />
                </View>
              </View>
            </View>

            {/* Stat Box 2 */}
            <View className="bg-white rounded-2xl p-4 w-[48%] mb-3">
              <Text className="text-gray-500 font-inter text-xs mb-2">Low Stock</Text>
              <View className="flex-row justify-between items-end">
                <Text className="text-dark font-poppins text-xl">{lowStockCount}</Text>
                <View className="bg-amber-50 p-2 rounded-xl">
                  <Ionicons name="warning-outline" size={20} color="#F59E0B" />
                </View>
              </View>
            </View>

            {/* Stat Box 3 — Owner only */}
            {isOwner && (
            <View className="bg-white rounded-2xl p-4 w-[48%]">
              <Text className="text-gray-500 font-inter text-xs mb-2">Total Sales</Text>
              <View className="flex-row justify-between items-end">
                <Text className="text-dark font-poppins text-xl" numberOfLines={1}>৳{totalSales.toFixed(2)}</Text>
                <View className="bg-purple-50 p-2 rounded-xl">
                  <Ionicons name="trending-up-outline" size={20} color="#9333EA" />
                </View>
              </View>
            </View>
            )}

            {/* Stat Box 4 */}
            <View className="bg-white rounded-2xl p-4 w-[48%]">
              <Text className="text-gray-500 font-inter text-xs mb-2">Transactions Today</Text>
              <View className="flex-row justify-between items-end">
                <Text className="text-dark font-poppins text-xl">{transactionsToday}</Text>
                <View className="bg-blue-50 p-2 rounded-xl">
                  <Ionicons name="bag-check-outline" size={20} color="#3B82F6" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stock Overview */}
        <View className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm shadow-gray-200/50">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-dark font-poppins text-lg">Stock Overview</Text>
          </View>

          {/* Chart representation */}
          {hasStockData ? (
            <View className="h-44">
              <CartesianChart data={stockChartData} xKey="dayIndex" yKeys={['added', 'removed']}>
                {({ points }) => (
                  <>
                    <Line points={points.added} color="#10B981" strokeWidth={3} />
                    <Line points={points.removed} color="#EF4444" strokeWidth={3} />
                  </>
                )}
              </CartesianChart>
            </View>
          ) : (
            <View className="h-44 justify-center items-center bg-gray-50 rounded-xl border border-gray-100">
              <Ionicons name="bar-chart-outline" size={40} color="#e2e8f0" />
              <Text className="text-gray-300 font-inter text-xs mt-2">No stock activity in this timeframe</Text>
            </View>
          )}

          {/* X Axis Labels */}
          <View className="flex-row justify-between mt-3 px-2">
            {stockChartData.map((d, index) => (
              <Text key={index} className="text-gray-400 font-inter text-[10px]">{d.label}</Text>
            ))}
          </View>

          {/* Legend */}
          <View className="flex-row justify-center mt-4" style={{ gap: 16 }}>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-[#10B981] mr-1.5" />
              <Text className="text-gray-500 font-inter text-xs">Stock In (Added)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-[#EF4444] mr-1.5" />
              <Text className="text-gray-500 font-inter text-xs">Stock Out (Sold/Removed)</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm shadow-gray-200/50">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-dark font-poppins text-lg">Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text className="text-primary font-inter text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <Text className="text-gray-400 font-inter text-center mt-4">No recent activity.</Text>
          ) : (
            recentTransactions.map(tx => {
              const dateStr = new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isSale = tx.type === 'sold';
              const isRemoval = tx.type === 'removed';

              let iconName: "arrow-down-circle" | "arrow-up-circle" | "alert-circle" = "arrow-up-circle";
              let iconColor = "#10B981"; // green
              let typeText = "Stock In";

              if (isSale) {
                iconName = "arrow-down-circle";
                iconColor = "#3B82F6"; // blue
                typeText = "Sale";
              } else if (isRemoval) {
                iconName = "alert-circle";
                iconColor = "#EF4444"; // red
                typeText = "Stock Out";
              }

              return (
                <View key={tx.id} className="flex-row justify-between items-center py-3 border-b border-gray-50">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Ionicons name={iconName} size={22} color={iconColor} className="mr-3" />
                    <View className="flex-shrink-1">
                      <Text className="text-dark font-poppins text-sm" numberOfLines={1}>{tx.product_name}</Text>
                      <Text className="text-gray-400 font-inter text-[10px] mt-0.5" numberOfLines={1}>
                        {typeText} • {tx.note || `Qty: ${tx.quantity}`}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-500 font-inter text-xs">{dateStr}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <View className="mb-24">
          <Text className="text-dark font-poppins text-lg mb-4">Quick Actions</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity onPress={() => router.push('/product/add' as any)} className="bg-white border border-gray-100 w-[23%] aspect-square rounded-2xl items-center justify-center shadow-sm shadow-gray-200/50">
              <Ionicons name="add-circle" size={24} color="#0F172A" className="mb-2" />
              <Text className="text-gray-600 font-inter text-[10px] text-center mt-1">Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowScanner(true)}
              className="bg-white border border-gray-100 w-[23%] aspect-square rounded-2xl items-center justify-center shadow-sm shadow-gray-200/50"
            >
              <Ionicons name="barcode-outline" size={24} color="#0F172A" className="mb-2" />
              <Text className="text-gray-600 font-inter text-[10px] text-center mt-1">Scan Barcode</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/product/sell' as any)} className="bg-white border border-gray-100 w-[23%] aspect-square rounded-2xl items-center justify-center shadow-sm shadow-gray-200/50">
              <Ionicons name="bag-handle-outline" size={24} color="#0F172A" className="mb-2" />
              <Text className="text-gray-600 font-inter text-[10px] text-center mt-1">Sell</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/reports')} className="bg-white border border-gray-100 w-[23%] aspect-square rounded-2xl items-center justify-center shadow-sm shadow-gray-200/50">
              <Ionicons name="document-text-outline" size={24} color="#0F172A" className="mb-2" />
              <Text className="text-gray-600 font-inter text-[10px] text-center mt-1">Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <View className="bg-white rounded-t-3xl max-h-[80%] p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-dark font-poppins text-xl">Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {lowStockCount === 0 ? (
              <View className="items-center py-12">
                <View className="w-16 h-16 rounded-full bg-emerald-50 items-center justify-center mb-4">
                  <Ionicons name="checkmark-done" size={32} color="#10B981" />
                </View>
                <Text className="text-dark font-poppins text-base text-center">All caught up! ✨</Text>
                <Text className="text-gray-400 font-inter text-xs text-center mt-1">All products have healthy stock levels.</Text>
              </View>
            ) : (
              <FlatList
                data={lowStockProducts}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View className="flex-row items-start py-4 border-b border-gray-100">
                    <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center mr-4">
                      <Ionicons name="warning" size={20} color="#F59E0B" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-dark font-poppins text-sm font-semibold">Low Stock Alert</Text>
                      <Text className="text-gray-600 font-inter text-xs mt-1">
                        "{item.name}" is running low — only <Text className="font-bold text-amber-600">{item.quantity}</Text> units left in inventory.
                      </Text>
                      <Text className="text-gray-400 font-inter text-[10px] mt-1">SKU: {item.sku} · Limit: {item.low_stock_threshold}</Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(scannedBarcode) => {
          const matched = products.find(
            p => p.barcode && p.barcode.trim() === scannedBarcode.trim()
          );

          if (matched) {
            Alert.alert(
              `Product Found: ${matched.name}`,
              `SKU: ${matched.sku}\nStock: ${matched.quantity} units\nPrice: ৳${matched.selling_price.toFixed(2)}`,
              [
                {
                  text: 'Sell Product',
                  onPress: () => {
                    router.push({
                      pathname: '/product/sell',
                      params: { barcode: scannedBarcode },
                    });
                  },
                },
                {
                  text: 'Edit Product',
                  onPress: () => {
                    router.push({
                      pathname: '/product/add',
                      params: { id: matched.id },
                    });
                  },
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
              ]
            );
          } else {
            Alert.alert(
              'Product Not Found',
              `No product is registered with barcode "${scannedBarcode}". Would you like to create a new product with this barcode?`,
              [
                {
                  text: 'Register Product',
                  onPress: () => {
                    router.push({
                      pathname: '/product/add',
                      params: { barcode: scannedBarcode },
                    });
                  },
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
              ]
            );
          }
        }}
      />

      <BottomNav currentRoute="/" />
    </SafeAreaView>
  );
}

const enhance = withObservables([], () => ({
  products: database.collections.get<ProductModel>('products').query().observe(),
  lowStockProducts: database.collections.get<ProductModel>('products').query(Q.where('quantity', Q.lte(5))).observe(),
  recentTransactions: database.collections.get<TransactionModel>('transactions').query(Q.sortBy('created_at', Q.desc), Q.take(5)).observe(),
  allTransactions: database.collections.get<TransactionModel>('transactions').query().observe(),
}));

export default enhance(HomeScreen);
