import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, ShoppingCart, Package, Download, FileSpreadsheet, FileText } from 'lucide-react-native';
import { CartesianChart, Line, PolarChart, Pie } from 'victory-native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system/legacy';
// expo-sharing is loaded dynamically to prevent crash when native module isn't in dev client
import { database } from '../../db';
import TransactionModel from '../../db/models/Transaction';
import ProductModel from '../../db/models/Product';
import BottomNav from '../../components/BottomNav';
import { useRole } from '../../hooks/useRole';
import { Ionicons } from '@expo/vector-icons';
import { calculateTotalProfit } from '../../utils/inventory';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function formatCurrency(value: number) {
  if (value >= 1000) return `৳${(value / 1000).toFixed(1)}k`;
  return `৳${value.toFixed(0)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner screen — receives live DB data as props
// ─────────────────────────────────────────────────────────────────────────────
interface ReportsScreenProps {
  soldTransactions: TransactionModel[];
  allTransactions: TransactionModel[];
  products: ProductModel[];
}

function ReportsScreen({ soldTransactions, allTransactions, products }: ReportsScreenProps) {
  const { isOwner } = useRole();

  const exportStockToCSV = async (productList: ProductModel[]) => {
    try {
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
        'In Stock Quantity',
        'Buying Price (BDT)',
        'Selling Price (BDT)',
        'Total Stock Value (BDT)',
        'Supplier',
        'Warehouse',
        'Location',
        'Low Stock Threshold',
        'Business Name'
      ];

      const rows = productList.map(p => {
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
      const filename = `stock_report_${new Date().toISOString().slice(0, 10)}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Stock Report',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Failed to export stock:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    }
  };

  const exportTransactionsToCSV = async (transactionList: TransactionModel[]) => {
    try {
      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '';
        let str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const headers = [
        'Date & Time',
        'Product Name',
        'Transaction Type',
        'Quantity',
        'Performed By',
        'Business Name',
        'Note'
      ];

      const rows = transactionList.map(tx => {
        const dateStr = tx.createdAt instanceof Date
          ? tx.createdAt.toLocaleString()
          : new Date(Number(tx.createdAt)).toLocaleString();

        return [
          escapeCSV(dateStr),
          escapeCSV(tx.product_name),
          escapeCSV(tx.type.toUpperCase()),
          tx.quantity || 0,
          escapeCSV(tx.by_user),
          escapeCSV(tx.business_name),
          escapeCSV(tx.note)
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const filename = `transaction_history_${new Date().toISOString().slice(0, 10)}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions Report',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Failed to export transactions:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    // Map WatermelonDB models to plain data structures expected by utility functions
    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      buying_price: p.buying_price || 0,
      selling_price: p.selling_price || 0,
      quantity: p.quantity || 0,
      low_stock_threshold: p.low_stock_threshold || 5,
    }));

    const formattedTx = soldTransactions.map(tx => ({
      product_id: tx.product_id,
      product_name: tx.product_name,
      type: tx.type as 'added' | 'sold' | 'removed' | 'returned',
      quantity: tx.quantity || 0,
      createdAt: tx.createdAt instanceof Date ? tx.createdAt.getTime() : Number(tx.createdAt),
    }));

    return calculateTotalProfit(formattedTx, formattedProducts);
  }, [soldTransactions, products]);

  // ── Sales Chart (last 30 days, grouped by day) ────────────────────────────
  const salesChartData = useMemo(() => {
    const productMap = new Map<string, ProductModel>();
    products.forEach(p => productMap.set(p.id, p));

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const cutoff = now - thirtyDaysMs;

    // bucket: day-offset → total revenue
    const buckets: Record<number, number> = {};

    soldTransactions.forEach(tx => {
      const ts = tx.createdAt instanceof Date ? tx.createdAt.getTime() : Number(tx.createdAt);
      if (ts < cutoff) return;
      const dayOffset = Math.floor((ts - cutoff) / (24 * 60 * 60 * 1000));
      const product = productMap.get(tx.product_id);
      const revenue = product ? product.selling_price * tx.quantity : 0;
      buckets[dayOffset] = (buckets[dayOffset] || 0) + revenue;
    });

    // Build array of 30 points (fill gaps with 0)
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= 30; i++) {
      points.push({ x: i, y: buckets[i] || 0 });
    }
    return points;
  }, [soldTransactions, products]);

  const hasSalesData = salesChartData.some(p => p.y > 0);

  // ── Top Products by units sold ─────────────────────────────────────────────
  const topProducts = useMemo(() => {
    const countMap: Record<string, { name: string; qty: number }> = {};
    soldTransactions.forEach(tx => {
      if (!countMap[tx.product_id]) {
        countMap[tx.product_id] = { name: tx.product_name, qty: 0 };
      }
      countMap[tx.product_id].qty += tx.quantity;
    });

    const sorted = Object.values(countMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const total = sorted.reduce((s, p) => s + p.qty, 0) || 1;

    return sorted.map((item, idx) => ({
      label: item.name,
      value: Math.round((item.qty / total) * 100),
      qty: item.qty,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));
  }, [soldTransactions]);

  // ── Transaction type breakdown ─────────────────────────────────────────────
  const breakdown = useMemo(() => {
    const counts = { added: 0, removed: 0, sold: 0, returned: 0 };
    allTransactions.forEach(tx => {
      if (tx.type in counts) counts[tx.type as keyof typeof counts]++;
    });
    return counts;
  }, [allTransactions]);

  const totalTx = allTransactions.length;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (!isOwner) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC] items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-6">
          <Ionicons name="lock-closed" size={36} color="#cbd5e1" />
        </View>
        <Text className="text-dark font-poppins text-xl text-center mb-2">Owner Access Only</Text>
        <Text className="text-gray-400 font-inter text-sm text-center leading-5">
          Reports contain sensitive financial data.{"\n"}Contact your business owner for access.
        </Text>
        <BottomNav currentRoute="/reports" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="px-5 mb-6">
          <Text className="text-dark font-poppins text-2xl">Reports</Text>
          <Text className="text-gray-400 font-inter text-xs mt-1">
            Based on {soldTransactions.length} sales · {totalTx} total transactions
          </Text>
        </View>

        {/* ── Stats Horizontal Scroll ─────────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-5 mb-6 pr-5">

          {/* Revenue */}
          <View className="bg-white border border-gray-100 rounded-2xl p-4 w-36 mr-3 shadow-sm shadow-gray-200/50">
            <Text className="text-gray-500 font-inter text-xs mb-2">Total Revenue</Text>
            <Text className="text-dark font-poppins text-xl mb-2" numberOfLines={1}>
              {formatCurrency(stats.totalRevenue)}
            </Text>
            <View className="flex-row items-center">
              <ShoppingCart size={13} color="#3B82F6" />
              <Text className="text-[#3B82F6] font-inter text-xs ml-1">
                {soldTransactions.length} sales
              </Text>
            </View>
          </View>

          {/* Profit */}
          <View className="bg-white border border-gray-100 rounded-2xl p-4 w-36 mr-3 shadow-sm shadow-gray-200/50">
            <Text className="text-gray-500 font-inter text-xs mb-2">Total Profit</Text>
            <Text
              className={`font-poppins text-xl mb-2 ${stats.totalProfit >= 0 ? 'text-dark' : 'text-red-500'}`}
              numberOfLines={1}
            >
              {formatCurrency(stats.totalProfit)}
            </Text>
            <View className="flex-row items-center">
              {stats.totalProfit >= 0
                ? <TrendingUp size={14} color="#10B981" />
                : <TrendingDown size={14} color="#EF4444" />}
              <Text className={`font-inter text-xs ml-1 ${stats.totalProfit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {stats.totalRevenue > 0
                  ? `${((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)}% margin`
                  : 'No sales yet'}
              </Text>
            </View>
          </View>

          {/* Cost */}
          <View className="bg-white border border-gray-100 rounded-2xl p-4 w-36 mr-8 shadow-sm shadow-gray-200/50">
            <Text className="text-gray-500 font-inter text-xs mb-2">Total Cost</Text>
            <Text className="text-dark font-poppins text-xl mb-2" numberOfLines={1}>
              {formatCurrency(stats.totalCost)}
            </Text>
            <View className="flex-row items-center">
              <Package size={13} color="#F59E0B" />
              <Text className="text-[#F59E0B] font-inter text-xs ml-1">COGS</Text>
            </View>
          </View>
        </ScrollView>

        {/* ── Export Data Section ────────────────────────────────────────── */}
        <View className="px-5 mb-6">
          <View className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm shadow-gray-200/50">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mr-2">
                <Download size={16} color="#10B981" />
              </View>
              <View>
                <Text className="text-dark font-poppins text-lg">Export Reports</Text>
                <Text className="text-gray-400 font-inter text-xs">Download spreadsheet-compatible CSV files</Text>
              </View>
            </View>

            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => exportStockToCSV(products)}
                className="flex-1 bg-emerald-50 border border-emerald-100 py-3.5 px-4 rounded-2xl flex-row items-center justify-center active:opacity-85"
                style={{ gap: 8 }}
              >
                <FileSpreadsheet size={16} color="#10B981" />
                <Text className="text-emerald-700 font-poppins text-sm font-semibold">Stock CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => exportTransactionsToCSV(allTransactions)}
                className="flex-1 bg-blue-50 border border-blue-100 py-3.5 px-4 rounded-2xl flex-row items-center justify-center active:opacity-85"
                style={{ gap: 8 }}
              >
                <FileText size={16} color="#3B82F6" />
                <Text className="text-blue-700 font-poppins text-sm font-semibold">History CSV</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Sales Overview Chart ────────────────────────────────────────── */}
        <View className="px-5 mb-6">
          <View className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm shadow-gray-200/50">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-dark font-poppins text-lg">Sales Overview</Text>
              <Text className="text-gray-400 font-inter text-xs">Last 30 days</Text>
            </View>

            {hasSalesData ? (
              <View className="h-48">
                <CartesianChart data={salesChartData} xKey="x" yKeys={['y']}>
                  {({ points }) => (
                    <Line points={points.y} color="#10B981" strokeWidth={3} />
                  )}
                </CartesianChart>
              </View>
            ) : (
              <View className="h-48 items-center justify-center">
                <TrendingUp size={40} color="#e2e8f0" />
                <Text className="text-gray-300 font-inter text-sm mt-3">No sales recorded yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Transaction Breakdown ───────────────────────────────────────── */}
        <View className="px-5 mb-6">
          <View className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm shadow-gray-200/50">
            <Text className="text-dark font-poppins text-lg mb-4">Transaction Breakdown</Text>
            <View className="flex-row flex-wrap">
              {[
                { label: 'Stock Added', count: breakdown.added, color: '#10B981' },
                { label: 'Stock Removed', count: breakdown.removed, color: '#EF4444' },
                { label: 'Sales', count: breakdown.sold, color: '#3B82F6' },
                { label: 'Returns', count: breakdown.returned, color: '#F59E0B' },
              ].map((item) => (
                <View
                  key={item.label}
                  className="w-1/2 mb-3 pr-2"
                >
                  <View className="bg-gray-50 rounded-2xl p-3 flex-row items-center">
                    <View
                      className="w-8 h-8 rounded-full mr-2.5"
                      style={{
                        backgroundColor: item.color + '15',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <View
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-dark font-poppins text-lg leading-tight">{item.count}</Text>
                      <Text className="text-gray-400 font-inter text-[10px] leading-tight mt-0.5" numberOfLines={1}>
                        {item.label}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Top Selling Products ────────────────────────────────────────── */}
        <View className="px-5 mb-8">
          <View className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm shadow-gray-200/50">
            <Text className="text-dark font-poppins text-lg mb-6">Top Selling Products</Text>

            {topProducts.length === 0 ? (
              <View className="items-center py-8">
                <Package size={40} color="#e2e8f0" />
                <Text className="text-gray-300 font-inter text-sm mt-3">No sales data available</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-between">
                {/* Pie chart */}
                <View className="w-28 h-28 justify-center items-center">
                  <PolarChart
                    data={topProducts}
                    valueKey="value"
                    colorKey="color"
                    labelKey="label"
                  >
                    <Pie.Chart innerRadius={30} />
                  </PolarChart>
                </View>

                {/* Legend */}
                <View className="flex-1 ml-6">
                  {topProducts.map((item) => (
                    <View key={item.label} className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }} />
                        <Text className="text-dark font-inter text-xs flex-1" numberOfLines={1}>
                          {item.label}
                        </Text>
                      </View>
                      <Text className="text-gray-500 font-inter text-xs">{item.value}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Extra spacing for Bottom Bar */}
        <View className="h-28" />
      </ScrollView>

      <BottomNav currentRoute="/reports" />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Wire up live observables from WatermelonDB
// ─────────────────────────────────────────────────────────────────────────────
const enhance = withObservables([], () => ({
  soldTransactions: database.collections
    .get<TransactionModel>('transactions')
    .query(Q.where('type', 'sold'))
    .observe(),
  allTransactions: database.collections
    .get<TransactionModel>('transactions')
    .query()
    .observe(),
  products: database.collections
    .get<ProductModel>('products')
    .query()
    .observe(),
}));

export default enhance(ReportsScreen);
