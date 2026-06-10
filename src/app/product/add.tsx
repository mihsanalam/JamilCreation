import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Image, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';

import { database } from '../../db';
import Product from '../../db/models/Product';
import Transaction from '../../db/models/Transaction';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

export default function AddProductScreen() {
  const router = useRouter();
  const { id, barcode: queryBarcode } = useLocalSearchParams<{ id?: string; barcode?: string }>();
  const { user } = useAuth();
  const businessName = user?.user_metadata?.business_name;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Set barcode if prefilled from routing query parameters
  useEffect(() => {
    if (queryBarcode) {
      setBarcode(queryBarcode);
    }
  }, [queryBarcode]);

  useEffect(() => {
    if (id) {
      const loadProduct = async () => {
        try {
          const product = await database.get<Product>('products').find(id);
          setName(product.name);
          setSku(product.sku);
          setBarcode(product.barcode || '');
          setCategory(product.category);
          setQuantity(product.quantity.toString());
          setBuyingPrice(product.buying_price.toString());
          setSellingPrice(product.selling_price.toString());
          setImageUri(product.image_url || null);
          setSupplier(product.supplier || '');
        } catch (error) {
          console.error("Failed to load product for editing", error);
        }
      };
      loadProduct();
    }
  }, [id]);

  const testSuppliers = ['Ali Traders', 'Ahmed Fabrics', 'Kasem Textiles', 'Global Imports', 'Local Dist A'];

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // pre-filter
    });

    if (!result.canceled) {
      // Compress: resize to max 1200px wide, 70% JPEG quality
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setImageUri(compressed.uri);
      setImageBase64(compressed.base64 || null);
    }
  };

  const generateSku = () => {
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    setSku(`PRD-${randomChars}`);
  };

  const handleSaveProduct = async () => {
    if (!name || !quantity || !buyingPrice || !sellingPrice || !category) {
      alert('Please fill out all required fields (Name, Category, Quantity, Prices).');
      return;
    }

    try {
      setIsSaving(true);

      let finalImageUrl = imageUri;

      if (imageUri && imageBase64 && (imageUri.startsWith('file://') || imageUri.startsWith('content://') || !imageUri.startsWith('http'))) {
        const ext = 'jpeg';
        const fileName = `product-${Date.now()}.${ext}`;
        const fileBody = decode(imageBase64);

        // Upload to 'products' bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, fileBody, {
            contentType: `image/${ext}`,
            upsert: true
          });

        if (uploadError) {
          console.warn('Product Image Upload to products bucket failed, attempting avatars fallback:', uploadError);

          // Try avatars bucket as fallback
          const { data: fallbackData, error: fallbackError } = await supabase.storage
            .from('avatars')
            .upload(fileName, fileBody, {
              contentType: `image/${ext}`,
              upsert: true
            });

          if (fallbackError) {
            throw new Error(
              'Failed to upload image. Please ensure you have created a public storage bucket named "products" in your Supabase dashboard.\n\nError details: ' +
              fallbackError.message
            );
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            finalImageUrl = publicUrlData.publicUrl;
          }
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(fileName);
          finalImageUrl = publicUrlData.publicUrl;
        }
      }

      await database.write(async () => {
        if (id) {
          // Edit Mode
          const productRecord = await database.get<Product>('products').find(id);
          await productRecord.update((product: Product) => {
            product.name = name;
            product.sku = sku;
            product.barcode = barcode || undefined;
            product.category = category;
            product.quantity = parseInt(quantity, 10);
            product.buying_price = parseFloat(buyingPrice);
            product.selling_price = parseFloat(sellingPrice);
            product.supplier = supplier || undefined;
            product.image_url = finalImageUrl || undefined;
            if (businessName) {
              product.business_name = businessName;
            }
          });

          // Log transaction for edit
          await database.get<Transaction>('transactions').create((tx: Transaction) => {
            tx.product_id = id;
            tx.product_name = name;
            tx.type = 'added'; // updated details log
            tx.quantity = 0;
            tx.note = `Product details updated`;
            tx.by_user = user?.email || user?.user_metadata?.full_name || 'Admin';
            tx.business_name = businessName || undefined;
          });
        } else {
          // Create Mode
          const newProduct = await database.get<Product>('products').create((product: Product) => {
            product.name = name;
            product.sku = sku || `PRD-${Date.now().toString().slice(-4)}`;
            product.barcode = barcode || undefined;
            product.category = category;
            product.quantity = parseInt(quantity, 10);
            product.buying_price = parseFloat(buyingPrice);
            product.selling_price = parseFloat(sellingPrice);
            product.supplier = supplier || undefined;
            product.image_url = finalImageUrl || undefined;
            product.low_stock_threshold = 5; // Default value
            product.business_name = businessName || undefined;
          });

          // Log transaction for initial stock
          await database.get<Transaction>('transactions').create((tx: Transaction) => {
            tx.product_id = newProduct.id;
            tx.product_name = name;
            tx.type = 'added';
            tx.quantity = parseInt(quantity, 10);
            tx.note = `Initial stock added (Price: $${parseFloat(buyingPrice).toFixed(2)})`;
            tx.by_user = user?.email || user?.user_metadata?.full_name || 'Admin';
            tx.business_name = businessName || undefined;
          });
        }
      });

      alert(id ? 'Product updated successfully!' : 'Product saved successfully to local database!');
      router.back();
    } catch (error) {
      const err = error as Error;
      alert('Error saving product: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <View className="px-5 pt-4 pb-4 flex-row items-center border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-dark font-poppins text-xl">{id ? 'Edit Product' : 'Add New Product'}</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>

        {/* Product Image */}
        <Text className="text-dark font-inter text-sm mb-3">Product Image</Text>
        <TouchableOpacity
          onPress={pickImage}
          className="border-2 border-dashed border-gray-300 rounded-3xl h-32 w-48 self-center items-center justify-center bg-gray-50 mb-6 overflow-hidden"
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color="#64748b" className="mb-2" />
              <Text className="text-gray-500 font-inter text-sm">Upload Image</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Product Name */}
        <View className="mb-4">
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2">
            <Text className="text-dark font-poppins text-xs mb-1">Product Name</Text>
            <TextInput
              className="font-inter text-dark text-sm p-0"
              placeholder="Enter product name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* SKU */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 mr-3">
            <Text className="text-dark font-poppins text-xs mb-1">SKU</Text>
            <TextInput
              className="font-inter text-dark text-sm p-0"
              placeholder="Auto-generate"
              placeholderTextColor="#9ca3af"
              value={sku}
              onChangeText={setSku}
            />
          </View>
          <TouchableOpacity onPress={generateSku} className="bg-gray-200 w-14 rounded-2xl items-center justify-center">
            <Ionicons name="shuffle-outline" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Barcode */}
        <View className="flex-row mb-4">
          <View className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 mr-3">
            <Text className="text-dark font-poppins text-xs mb-1">Barcode</Text>
            <TextInput
              className="font-inter text-dark text-sm p-0"
              placeholder="Scan barcode"
              placeholderTextColor="#9ca3af"
              value={barcode}
              onChangeText={setBarcode}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowScanner(true)}
            className="bg-gray-200 w-14 rounded-2xl items-center justify-center"
          >
            <Ionicons name="barcode-outline" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Category */}
        <View className="mb-4">
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2">
            <Text className="text-dark font-poppins text-xs mb-1">Category</Text>
            <TextInput
              className="font-inter text-dark text-sm p-0"
              placeholder="e.g. Electronics, Clothing"
              placeholderTextColor="#9ca3af"
              value={category}
              onChangeText={setCategory}
            />
          </View>
        </View>

        {/* Description */}
        <View className="mb-4">
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 min-h-[100px]">
            <Text className="text-dark font-poppins text-xs mb-1">Description</Text>
            <TextInput
              className="font-inter text-dark text-sm p-0"
              placeholder="Enter description"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Pricing & Quantity Row */}
        <View className="flex-row justify-between mb-4">
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 w-[30%]">
            <Text className="text-dark font-poppins text-xs mb-1">Quantity</Text>
            <TextInput
              className="font-inter text-dark text-sm p-0"
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 w-[32%]">
            <Text className="text-dark font-poppins text-xs mb-1">Buying Price</Text>
            <TextInput
              className="font-inter text-dark text-sm p-0"
              placeholder="$ 0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              value={buyingPrice}
              onChangeText={setBuyingPrice}
            />
          </View>
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 w-[32%]">
            <Text className="text-dark font-poppins text-xs mb-1">Selling Price</Text>
            <TextInput
              className="font-inter text-dark text-sm p-0"
              placeholder="$ 0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              value={sellingPrice}
              onChangeText={setSellingPrice}
            />
          </View>
        </View>

        {/* Supplier */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={() => setShowSupplierModal(true)}
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-dark font-poppins text-xs mb-1">Supplier</Text>
              <Text className={`font-inter text-sm ${supplier ? 'text-dark' : 'text-gray-400'}`}>
                {supplier ? supplier : 'Select supplier'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSaveProduct}
          disabled={isSaving}
          className="bg-[#10B981] rounded-2xl py-4 items-center mb-10 shadow-lg shadow-[#10B981]/30"
        >
          <Text className="text-white font-poppins text-base">
            {isSaving ? 'Saving...' : id ? 'Update Product' : 'Save Product'}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Supplier Modal */}
      <Modal
        visible={showSupplierModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSupplierModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowSupplierModal(false)}
        >
          <View className="bg-white rounded-t-[36px] min-h-[50%] max-h-[80%] p-6">
            {/* Drag handle */}
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-4" />

            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-dark font-poppins text-lg font-bold">Select Supplier</Text>
              <TouchableOpacity onPress={() => setShowSupplierModal(false)} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                <Ionicons name="close" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={testSuppliers}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-4 border-b border-gray-100"
                  onPress={() => {
                    setSupplier(item);
                    setShowSupplierModal(false);
                  }}
                >
                  <Text className={`font-inter text-base ${supplier === item ? 'text-[#10B981] font-medium' : 'text-dark'}`}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(scannedBarcode) => {
          setBarcode(scannedBarcode);
        }}
      />
    </SafeAreaView>
  );
}
