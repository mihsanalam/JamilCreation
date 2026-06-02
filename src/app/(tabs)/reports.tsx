import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Package, ArrowRightLeft, BarChart3, Settings, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react-native';
import { CartesianChart, Line, PolarChart, Pie } from 'victory-native';
import { useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav';

export default function ReportsScreen() {
  const router = useRouter();

  const salesData = [
    { x: 1, y: 3000 },
    { x: 10, y: 11000 },
    { x: 20, y: 4000 },
    { x: 30, y: 15000 }
  ];

  const pieData = [
    { label: "JBL", value: 35, color: "#10B981" },
    { label: "Dell", value: 25, color: "#3B82F6" },
    { label: "Nike", value: 20, color: "#F59E0B" },
    { label: "Chair", value: 20, color: "#EF4444" }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-5 mb-6">
          <Text className="text-dark font-poppins text-2xl">Reports</Text>
        </View>

        {/* Stats Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-5 mb-6 pr-5">
          {/* Stat 1 */}
          <View className="bg-white border border-gray-100 rounded-2xl p-4 w-36 mr-3 shadow-sm shadow-gray-200/50">
            <Text className="text-gray-500 font-inter text-xs mb-2">Total Sales</Text>
            <Text className="text-dark font-poppins text-xl mb-2">$25,450</Text>
            <View className="flex-row items-center">
              <TrendingUp size={14} color="#10B981" />
              <Text className="text-[#10B981] font-inter text-xs ml-1">+12.5%</Text>
            </View>
          </View>

          {/* Stat 2 */}
          <View className="bg-white border border-gray-100 rounded-2xl p-4 w-36 mr-3 shadow-sm shadow-gray-200/50">
            <Text className="text-gray-500 font-inter text-xs mb-2">Total Profit</Text>
            <Text className="text-dark font-poppins text-xl mb-2">$8,450</Text>
            <View className="flex-row items-center">
              <TrendingUp size={14} color="#10B981" />
              <Text className="text-[#10B981] font-inter text-xs ml-1">+8.2%</Text>
            </View>
          </View>

          {/* Stat 3 */}
          <View className="bg-white border border-gray-100 rounded-2xl p-4 w-36 mr-8 shadow-sm shadow-gray-200/50">
            <Text className="text-gray-500 font-inter text-xs mb-2">Total Cost</Text>
            <Text className="text-dark font-poppins text-xl mb-2">$17,000</Text>
            <View className="flex-row items-center">
              <TrendingDown size={14} color="#EF4444" />
              <Text className="text-[#EF4444] font-inter text-xs ml-1">-4.8%</Text>
            </View>
          </View>
        </ScrollView>

        {/* Sales Overview Chart */}
        <View className="px-5 mb-6">
          <View className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm shadow-gray-200/50">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-dark font-poppins text-lg">Sales Overview</Text>
              <TouchableOpacity className="border border-gray-200 rounded-xl px-3 py-1.5 flex-row items-center">
                <Text className="text-gray-500 font-inter text-xs mr-2">This Month</Text>
                <ChevronDown size={12} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {/* Victory Line Chart Representation */}
            <View className="h-48">
              <CartesianChart data={salesData} xKey="x" yKeys={["y"]}>
                {({ points }) => (
                  <Line points={points.y} color="#10B981" strokeWidth={3} />
                )}
              </CartesianChart>
            </View>
          </View>
        </View>

        {/* Top Selling Products */}
        <View className="px-5 mb-8">
          <View className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm shadow-gray-200/50">
            <Text className="text-dark font-poppins text-lg mb-6">Top Selling Products</Text>
            
            <View className="flex-row items-center justify-between">
              {/* Victory Pie Chart */}
              <View className="w-28 h-28 justify-center items-center">
                <PolarChart data={pieData} valueKey="value" colorKey="color" labelKey="label">
                  <Pie.Chart innerRadius={30} />
                </PolarChart>
              </View>
              
              {/* Legend */}
              <View className="flex-1 ml-6">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 bg-[#10B981] rounded-sm mr-2" />
                    <Text className="text-dark font-inter text-xs">JBL Tune 520BT</Text>
                  </View>
                  <Text className="text-dark font-inter text-xs">35%</Text>
                </View>

                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 bg-[#3B82F6] rounded-sm mr-2" />
                    <Text className="text-dark font-inter text-xs">Dell Monitor 24"</Text>
                  </View>
                  <Text className="text-dark font-inter text-xs">25%</Text>
                </View>

                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 bg-[#F59E0B] rounded-sm mr-2" />
                    <Text className="text-dark font-inter text-xs">Nike Hoodie</Text>
                  </View>
                  <Text className="text-dark font-inter text-xs">20%</Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 bg-[#EF4444] rounded-sm mr-2" />
                    <Text className="text-dark font-inter text-xs">Office Chair Pro</Text>
                  </View>
                  <Text className="text-dark font-inter text-xs">20%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Extra spacing for Bottom Bar */}
        <View className="h-28" />
      </ScrollView>

      <BottomNav currentRoute="/reports" />
    </SafeAreaView>
  );
}
