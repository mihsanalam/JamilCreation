import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-500 font-inter text-base">Good Morning,</Text>
            <Text className="text-dark font-poppins text-2xl mt-1">Jamil 👋</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity className="relative mr-4">
              <Ionicons name="notifications-outline" size={28} color="#0F172A" />
              <View className="absolute -top-1 -right-1 bg-danger w-5 h-5 rounded-full items-center justify-center border-2 border-white">
                <Text className="text-white text-[10px] font-bold">2</Text>
              </View>
            </TouchableOpacity>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
              className="w-12 h-12 rounded-full"
            />
          </View>
        </View>

        {/* Overview Card */}
        <View className="bg-primary rounded-3xl p-5 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-poppins text-lg">Overview</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-white/90 font-inter mr-1 text-sm">May 20, 2024</Text>
              <Ionicons name="chevron-down" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {/* Stat Box 1 */}
            <View className="bg-white rounded-2xl p-4 w-[48%] mb-3">
              <Text className="text-gray-500 font-inter text-xs mb-2">Total Products</Text>
              <View className="flex-row justify-between items-end">
                <Text className="text-dark font-poppins text-xl">1,245</Text>
                <View className="bg-primary/10 p-2 rounded-xl">
                  <Ionicons name="cube-outline" size={20} color="#10B981" />
                </View>
              </View>
            </View>

            {/* Stat Box 2 */}
            <View className="bg-white rounded-2xl p-4 w-[48%] mb-3">
              <Text className="text-gray-500 font-inter text-xs mb-2">Low Stock</Text>
              <View className="flex-row justify-between items-end">
                <Text className="text-dark font-poppins text-xl">23</Text>
                <View className="bg-warning/10 p-2 rounded-xl">
                  <Ionicons name="warning-outline" size={20} color="#F59E0B" />
                </View>
              </View>
            </View>

            {/* Stat Box 3 */}
            <View className="bg-white rounded-2xl p-4 w-[48%]">
              <Text className="text-gray-500 font-inter text-xs mb-2">Total Sales</Text>
              <View className="flex-row justify-between items-end">
                <Text className="text-dark font-poppins text-xl">$25,450</Text>
                <View className="bg-purple-100 p-2 rounded-xl">
                  <Ionicons name="trending-up-outline" size={20} color="#9333EA" />
                </View>
              </View>
            </View>

            {/* Stat Box 4 */}
            <View className="bg-white rounded-2xl p-4 w-[48%]">
              <Text className="text-gray-500 font-inter text-xs mb-2">Transactions Today</Text>
              <View className="flex-row justify-between items-end">
                <Text className="text-dark font-poppins text-xl">48</Text>
                <View className="bg-blue-100 p-2 rounded-xl">
                  <Ionicons name="bag-check-outline" size={20} color="#3B82F6" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stock Overview (This Week) */}
        <View className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm shadow-gray-200/50">
          <View className="flex-row items-center mb-4">
            <Text className="text-dark font-poppins text-lg">Stock Overview </Text>
            <Text className="text-gray-400 font-inter text-sm">(This Week)</Text>
          </View>
          {/* Fake Chart representation */}
          <View className="h-40 justify-center items-center bg-gray-50 rounded-xl border border-gray-100">
            <Ionicons name="bar-chart" size={48} color="#10B981" opacity={0.3} />
            <Text className="text-gray-400 font-inter text-xs mt-2">Chart Visualization Placeholder</Text>
          </View>
          {/* X Axis Labels */}
          <View className="flex-row justify-between mt-3 px-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <Text key={day} className="text-gray-400 font-inter text-xs">{day}</Text>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm shadow-gray-200/50">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-dark font-poppins text-lg">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-primary font-inter text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {/* Activity Item 1 */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-3">
                <Ionicons name="add-circle-outline" size={24} color="#10B981" />
              </View>
              <View>
                <Text className="text-dark font-poppins text-sm">JBL Tune 520BT</Text>
                <Text className="text-gray-400 font-inter text-xs mt-0.5">Stock Added</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-dark font-poppins text-base">+10</Text>
              <Text className="text-gray-400 font-inter text-xs mt-0.5">9:45 AM</Text>
            </View>
          </View>

          {/* Activity Item 2 */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-xl bg-blue-100 items-center justify-center mr-3">
                <Ionicons name="remove-circle-outline" size={24} color="#3B82F6" />
              </View>
              <View>
                <Text className="text-dark font-poppins text-sm">Dell Monitor 24"</Text>
                <Text className="text-gray-400 font-inter text-xs mt-0.5">Stock Sold</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-danger font-poppins text-base">-2</Text>
              <Text className="text-gray-400 font-inter text-xs mt-0.5">11:20 AM</Text>
            </View>
          </View>

          {/* Activity Item 3 */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-xl bg-warning/10 items-center justify-center mr-3">
                <Ionicons name="arrow-undo-outline" size={24} color="#F59E0B" />
              </View>
              <View>
                <Text className="text-dark font-poppins text-sm">Office Chair Pro</Text>
                <Text className="text-gray-400 font-inter text-xs mt-0.5">Returned</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-primary font-poppins text-base">+1</Text>
              <Text className="text-gray-400 font-inter text-xs mt-0.5">1:10 PM</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-24">
          <Text className="text-dark font-poppins text-lg mb-4">Quick Actions</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity onPress={() => router.push('/product/add' as any)} className="bg-white border border-gray-100 w-[23%] aspect-square rounded-2xl items-center justify-center shadow-sm shadow-gray-200/50">
              <Ionicons name="add-circle" size={24} color="#0F172A" className="mb-2" />
              <Text className="text-gray-600 font-inter text-[10px] text-center mt-1">Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-white border border-gray-100 w-[23%] aspect-square rounded-2xl items-center justify-center shadow-sm shadow-gray-200/50">
              <Ionicons name="barcode-outline" size={24} color="#0F172A" className="mb-2" />
              <Text className="text-gray-600 font-inter text-[10px] text-center mt-1">Scan Barcode</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-white border border-gray-100 w-[23%] aspect-square rounded-2xl items-center justify-center shadow-sm shadow-gray-200/50">
              <Ionicons name="swap-horizontal" size={24} color="#0F172A" className="mb-2" />
              <Text className="text-gray-600 font-inter text-[10px] text-center mt-1">New Transaction</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-white border border-gray-100 w-[23%] aspect-square rounded-2xl items-center justify-center shadow-sm shadow-gray-200/50">
              <Ionicons name="document-text-outline" size={24} color="#0F172A" className="mb-2" />
              <Text className="text-gray-600 font-inter text-[10px] text-center mt-1">Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomNav currentRoute="/" />
    </SafeAreaView>
  );
}
