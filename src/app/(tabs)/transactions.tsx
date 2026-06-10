import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../../components/BottomNav';
import withObservables from '@nozbe/with-observables';
import { database } from '../../db';
import { Q } from '@nozbe/watermelondb';
import TransactionModel from '../../db/models/Transaction';
import { router } from 'expo-router';

const TransactionItem = React.memo(({ tx }: { tx: TransactionModel }) => {
  const dateStr = new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
    <View className="bg-white rounded-3xl p-4 mb-3 border border-gray-100 shadow-sm shadow-gray-200/50 flex-row justify-between items-center">
      <View className="flex-row items-center flex-1">
        <Ionicons name={iconName} size={26} color={iconColor} className="mr-3" />
        <View className="flex-1">
          <Text className="text-dark font-poppins text-base">{tx.product_name}</Text>
          <Text className="text-gray-400 font-inter text-xs mt-0.5">{typeText} • {tx.note || `Qty: ${tx.quantity}`}</Text>
        </View>
      </View>
      <Text className="text-gray-500 font-inter text-xs ml-3">{dateStr}</Text>
    </View>
  );
});

const EnhancedTransactionItem = withObservables(['tx'], ({ tx }: { tx: TransactionModel }) => ({
  tx,
}))(TransactionItem);

function TransactionsScreen({ transactions = [] }: { transactions: TransactionModel[] }) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  const filteredTransactions = transactions.filter(tx => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Stock Added') return tx.type === 'added';
    if (selectedFilter === 'Stock Removed') return tx.type === 'removed';
    if (selectedFilter === 'Sales') return tx.type === 'sold';
    if (selectedFilter === 'Return') return tx.type === 'returned';
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-dark font-poppins text-2xl">Transactions</Text>
      </View>

      {/* Categories / Filters */}
      <View className="px-5 mb-4 mt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', 'Stock Added', 'Stock Removed', 'Sales', 'Return'].map((category) => (
            <TouchableOpacity 
              key={category} 
              onPress={() => setSelectedFilter(category)}
              className={`px-5 py-2 rounded-full mr-2 ${selectedFilter === category ? 'bg-primary' : 'bg-white border border-gray-200'}`}
            >
              <Text className={`font-inter text-sm ${selectedFilter === category ? 'text-white' : 'text-gray-500'}`}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          transactions.length === 0 ? (
            <View className="items-center justify-center py-16 px-6 bg-white border border-gray-100 rounded-[32px] mt-6 shadow-sm shadow-gray-200/30">
              <View className="bg-[#3B82F6]/10 w-20 h-20 rounded-full items-center justify-center mb-6">
                <Ionicons name="swap-horizontal-outline" size={40} color="#3B82F6" />
              </View>
              <Text className="text-dark font-poppins text-lg font-bold mb-2 text-center">No Transactions Yet</Text>
              <Text className="text-gray-400 font-inter text-sm text-center mb-6 leading-5">
                Every sale, inventory addition, or return will be recorded in this live audit trail.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/product/sell')}
                className="bg-primary px-6 py-3.5 rounded-2xl shadow-lg shadow-primary/20"
              >
                <Text className="text-white font-poppins text-sm font-semibold">Record Your First Sale</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center justify-center py-16 px-6 bg-white border border-gray-100 rounded-[32px] mt-6 shadow-sm shadow-gray-200/30">
              <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-6">
                <Ionicons name="funnel-outline" size={40} color="#64748B" />
              </View>
              <Text className="text-dark font-poppins text-lg font-bold mb-2 text-center">No Matching Transactions</Text>
              <Text className="text-gray-400 font-inter text-sm text-center mb-6 leading-5">
                We couldn't find any transaction matching your selected type filter.
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedFilter('All')}
                className="bg-gray-800 px-6 py-3.5 rounded-2xl shadow-lg shadow-gray-800/20"
              >
                <Text className="text-white font-poppins text-sm font-semibold">Show All Logs</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          filteredTransactions.map(tx => (
            <EnhancedTransactionItem key={tx.id} tx={tx} />
          ))
        )}
        <View className="h-28" />
      </ScrollView>

      <BottomNav currentRoute="/transactions" />
    </SafeAreaView>
  );
}

const enhance = withObservables([], () => ({
  transactions: database.collections.get<TransactionModel>('transactions').query(Q.sortBy('created_at', Q.desc)).observe(),
}));

export default enhance(TransactionsScreen);
