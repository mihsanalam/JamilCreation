import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Filter, Layers, Monitor, Package, Mouse, Shirt, Home, ArrowRightLeft, BarChart3, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav';

export default function TransactionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-dark font-poppins text-2xl">Transactions</Text>
        <TouchableOpacity>
          <Filter size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Categories / Filters */}
      <View className="px-5 mb-4 mt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity className="bg-primary px-5 py-2 rounded-full mr-2">
            <Text className="text-white font-inter text-sm">All</Text>
          </TouchableOpacity>
          {['Stock Added', 'Stock Removed', 'Sales', 'Return'].map((category) => (
            <TouchableOpacity key={category} className="bg-gray-100 px-4 py-2 rounded-full mr-2">
              <Text className="text-gray-500 font-inter text-sm">{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
        
        {/* Transaction 1 */}
        <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100 shadow-sm shadow-gray-200/50">
          <View className="bg-[#E6F4EA] rounded-2xl w-14 h-14 items-center justify-center mr-4">
             <Layers size={24} color="#10B981" />
          </View>
          <View className="flex-1 justify-center">
             <Text className="text-dark font-poppins text-base mb-1">JBL Tune 520BT</Text>
             <Text className="text-gray-600 font-inter text-sm mb-1">Stock Added</Text>
             <Text className="text-gray-400 font-inter text-xs">By: Admin</Text>
          </View>
          <View className="items-end justify-center">
             <Text className="text-[#10B981] font-poppins text-lg mb-2">+10</Text>
             <Text className="text-gray-400 font-inter text-xs">9:45 AM</Text>
          </View>
        </View>

        {/* Transaction 2 */}
        <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100 shadow-sm shadow-gray-200/50">
          <View className="bg-[#F3E8FF] rounded-2xl w-14 h-14 items-center justify-center mr-4">
             <Monitor size={24} color="#8B5CF6" />
          </View>
          <View className="flex-1 justify-center">
             <Text className="text-dark font-poppins text-base mb-1">Dell Monitor 24"</Text>
             <Text className="text-gray-600 font-inter text-sm mb-1">Stock Sold</Text>
             <Text className="text-gray-400 font-inter text-xs">By: John Doe</Text>
          </View>
          <View className="items-end justify-center">
             <Text className="text-[#EF4444] font-poppins text-lg mb-2">-2</Text>
             <Text className="text-gray-400 font-inter text-xs">11:20 AM</Text>
          </View>
        </View>

        {/* Transaction 3 */}
        <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100 shadow-sm shadow-gray-200/50">
          <View className="bg-[#FFEDD5] rounded-2xl w-14 h-14 items-center justify-center mr-4">
             <Package size={24} color="#F59E0B" />
          </View>
          <View className="flex-1 justify-center">
             <Text className="text-dark font-poppins text-base mb-1">Office Chair Pro</Text>
             <Text className="text-gray-600 font-inter text-sm mb-1">Returned</Text>
             <Text className="text-gray-400 font-inter text-xs">By: Sarah</Text>
          </View>
          <View className="items-end justify-center">
             <Text className="text-[#10B981] font-poppins text-lg mb-2">+1</Text>
             <Text className="text-gray-400 font-inter text-xs">1:10 PM</Text>
          </View>
        </View>

        {/* Transaction 4 */}
        <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100 shadow-sm shadow-gray-200/50">
          <View className="bg-[#FEE2E2] rounded-2xl w-14 h-14 items-center justify-center mr-4">
             <Mouse size={24} color="#EF4444" />
          </View>
          <View className="flex-1 justify-center">
             <Text className="text-dark font-poppins text-base mb-1">Logitech MX Master 3S</Text>
             <Text className="text-gray-600 font-inter text-sm mb-1">Stock Removed</Text>
             <Text className="text-gray-400 font-inter text-xs">By: Admin</Text>
          </View>
          <View className="items-end justify-center">
             <Text className="text-[#EF4444] font-poppins text-lg mb-2">-3</Text>
             <Text className="text-gray-400 font-inter text-xs">2:30 PM</Text>
          </View>
        </View>

        {/* Transaction 5 */}
        <View className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100 shadow-sm shadow-gray-200/50">
          <View className="bg-[#E6F4EA] rounded-2xl w-14 h-14 items-center justify-center mr-4">
             <Shirt size={24} color="#10B981" />
          </View>
          <View className="flex-1 justify-center">
             <Text className="text-dark font-poppins text-base mb-1">Nike Hoodie</Text>
             <Text className="text-gray-600 font-inter text-sm mb-1">Stock Added</Text>
             <Text className="text-gray-400 font-inter text-xs">By: John Doe</Text>
          </View>
          <View className="items-end justify-center">
             <Text className="text-[#10B981] font-poppins text-lg mb-2">+5</Text>
             <Text className="text-gray-400 font-inter text-xs">3:15 PM</Text>
          </View>
        </View>
        
        {/* Extra spacing for Bottom Bar */}
        <View className="h-28" />
      </ScrollView>

      <BottomNav currentRoute="/transactions" />
    </SafeAreaView>
  );
}
