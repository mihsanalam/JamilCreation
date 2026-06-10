import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, Package, ArrowRightLeft, BarChart3, Settings } from 'lucide-react-native';
import { useRouter, Href } from 'expo-router';

type BottomNavProps = {
  currentRoute: '/' | '/inventory' | '/transactions' | '/reports' | '/settings';
};

export default function BottomNav({ currentRoute }: BottomNavProps) {
  const router = useRouter();

  const getIconColor = (route: string) => currentRoute === route ? "#10B981" : "#9ca3af";
  const getTextColor = (route: string) => currentRoute === route ? "text-[#10B981]" : "text-gray-400";

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 px-6 flex-row justify-between pb-8 z-20">
      <TouchableOpacity className="items-center" onPress={() => currentRoute !== '/' && router.replace('/' as Href)}>
        <Home size={24} color={getIconColor('/')} />
        <Text className={`${getTextColor('/')} font-inter text-[10px] mt-1`}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center" onPress={() => currentRoute !== '/inventory' && router.replace('/inventory' as Href)}>
        <Package size={24} color={getIconColor('/inventory')} />
        <Text className={`${getTextColor('/inventory')} font-inter text-[10px] mt-1`}>Inventory</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center" onPress={() => currentRoute !== '/transactions' && router.replace('/transactions' as Href)}>
        <ArrowRightLeft size={24} color={getIconColor('/transactions')} />
        <Text className={`${getTextColor('/transactions')} font-inter text-[10px] mt-1`}>Transactions</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center" onPress={() => currentRoute !== '/reports' && router.replace('/reports' as Href)}>
        <BarChart3 size={24} color={getIconColor('/reports')} />
        <Text className={`${getTextColor('/reports')} font-inter text-[10px] mt-1`}>Reports</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center" onPress={() => currentRoute !== '/settings' && router.replace('/settings' as Href)}>
        <Settings size={24} color={getIconColor('/settings')} />
        <Text className={`${getTextColor('/settings')} font-inter text-[10px] mt-1`}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}
