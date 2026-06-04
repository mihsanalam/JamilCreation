import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, ShoppingCart, Package } from 'lucide-react-native';
import { CartesianChart, Line, PolarChart, Pie } from 'victory-native';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../db';
import TransactionModel from '../../db/models/Transaction';
import ProductModel from '../../db/models/Product';
import BottomNav from '../../components/BottomNav';

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

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    // We need selling_price & buying_price per product for accurate P&L
    // Build a quick lookup map: productId → product model
    const productMap = new Map<string, ProductModel>();
    products.forEach(p => productMap.set(p.id, p));

    let totalRevenue = 0;
    let totalCost = 0;

    soldTransactions.forEach(tx => {
      const product = productMap.get(tx.product_id);
      if (product) {
        totalRevenue += product.selling_price * tx.quantity;
        totalCost += product.buying_price * tx.quantity;
      } else {
        // Fallback: no price info — skip for P&L but count transactions
      }
    });

    const totalProfit = totalRevenue - totalCost;

    return { totalRevenue, totalCost, totalProfit };
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
                { label: 'Stock Added',   count: breakdown.added,    color: '#10B981' },
                { label: 'Stock Removed', count: breakdown.removed,  color: '#EF4444' },
                { label: 'Sales',         count: breakdown.sold,     color: '#3B82F6' },
                { label: 'Returns',       count: breakdown.returned, color: '#F59E0B' },
              ].map((item) => (
                <View
                  key={item.label}
                  className="w-1/2 mb-4 pr-2"
                >
                  <View className="bg-gray-50 rounded-2xl p-3">
                    <View className="w-7 h-7 rounded-full mb-2 items-center justify-center" style={{ backgroundColor: item.color + '22' }}>
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    </View>
                    <Text className="text-dark font-poppins text-xl">{item.count}</Text>
                    <Text className="text-gray-400 font-inter text-xs">{item.label}</Text>
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
