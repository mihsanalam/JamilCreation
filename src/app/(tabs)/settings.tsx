import React from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Home, 
  Package, 
  ArrowRightLeft, 
  BarChart3, 
  Settings as SettingsIcon, 
  User, 
  Sliders, 
  DollarSign, 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  Bell, 
  RefreshCw, 
  FileText,
  ChevronRight
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../services/supabase';
import QRCode from 'react-native-qrcode-svg';
import { Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';
import { database } from '../../db';
import { sync } from '../../db/sync';
import { useRole } from '../../hooks/useRole';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { isOwner, role } = useRole();
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Edit Profile Modal states
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editRole, setEditRole] = useState<'owner' | 'staff'>('staff');
  const [savingProfile, setSavingProfile] = useState(false);

  // Team members management states
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'owner' | 'staff'>('staff');
  const [savingMember, setSavingMember] = useState(false);

  const openEditProfile = () => {
    setEditFullName(fullName);
    setEditBusinessName(businessName);
    setEditRole(role);
    setProfileModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    if (!editFullName.trim() || !editBusinessName.trim()) {
      Alert.alert('Validation Error', 'Full Name and Business Name cannot be empty.');
      return;
    }
    try {
      setSavingProfile(true);
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editFullName.trim(),
          business_name: editBusinessName.trim(),
          role: editRole
        }
      });
      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully!');
      setProfileModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await sync();
      Alert.alert('Backup & Sync', 'Database synchronization completed successfully!');
    } catch (error: any) {
      Alert.alert('Backup & Sync Error', error.message || 'Synchronization failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.warn("Auth sign out error", e);
            } finally {
              try {
                await database.write(async () => {
                  await database.unsafeResetDatabase();
                });
              } catch (dbErr) {
                console.error("Failed to reset database on logout:", dbErr);
              }
            }
          },
        },
      ]
    );
  };

  const fullName = user?.user_metadata?.full_name || 'Guest User';
  const businessName = user?.user_metadata?.business_name || 'My Business';
  const email = user?.email || 'No email attached';
  const avatarUrl = profileImage || user?.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + fullName;

  const fetchTeamMembers = async () => {
    if (!businessName) return;
    try {
      setLoadingTeam(true);
      const { data, error } = await supabase
        .from('business_members')
        .select('*')
        .eq('business_name', businessName)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (e: any) {
      console.error('Error fetching team:', e);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (isOwner && businessName) {
      fetchTeamMembers();
    }
  }, [isOwner, businessName]);

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      Alert.alert('Validation Error', 'Email cannot be empty.');
      return;
    }
    try {
      setSavingMember(true);
      const { error } = await supabase
        .from('business_members')
        .insert({
          business_name: businessName,
          email: newMemberEmail.trim().toLowerCase(),
          role: newMemberRole
        });
      if (error) throw error;
      Alert.alert('Success', 'Team member added successfully!');
      setAddMemberModalVisible(false);
      setNewMemberEmail('');
      fetchTeamMembers();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add member.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, currentRole: string) => {
    const nextRole = currentRole === 'owner' ? 'staff' : 'owner';
    try {
      const { error } = await supabase
        .from('business_members')
        .update({ role: nextRole })
        .eq('id', memberId);
      if (error) throw error;
      Alert.alert('Success', 'Member role updated successfully!');
      fetchTeamMembers();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (memberEmail.toLowerCase() === email.toLowerCase()) {
      Alert.alert('Action Denied', 'You cannot remove yourself from the business.');
      return;
    }
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberEmail} from this business?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('business_members')
                .delete()
                .eq('id', memberId);
              if (error) throw error;
              Alert.alert('Success', 'Member removed successfully!');
              fetchTeamMembers();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to remove member.');
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS === 'ios',
        aspect: [1, 1],
        quality: 0.5,
        base64: true, // Need base64 to fix React Native FormData bug
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;

        // Compress before upload: 400px wide, 70% JPEG
        const compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 400 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        setProfileImage(compressed.uri);
        if (!user) return;

        const ext = 'jpeg';
        const fileName = `${user.id}-${Date.now()}.${ext}`;
        const fileBody = decode(compressed.base64!);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, fileBody, { 
            contentType: `image/${ext}`,
            upsert: true 
          });

        if (uploadError) {
          console.error('Upload Error:', uploadError);
          alert('Failed to upload image. Please try again.');
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Update user metadata
        await supabase.auth.updateUser({
          data: { avatar_url: publicUrlData.publicUrl }
        });
        
        alert('Profile picture updated successfully!');
      }
    } catch (error: any) {
      alert('Error updating profile: ' + error.message);
    }
  };

  // MFA State
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const startMfaEnrollment = async () => {
    try {
      setMfaLoading(true);
      setMfaModalVisible(true);
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      
      setMfaFactorId(data.id);
      setQrCodeUrl(data.totp.uri);
    } catch (e: any) {
      alert('Error starting 2FA: ' + e.message);
      setMfaModalVisible(false);
    } finally {
      setMfaLoading(false);
    }
  };

  const verifyMfaEnrollment = async () => {
    if (!mfaVerifyCode || mfaVerifyCode.length < 6) return;
    try {
      setMfaLoading(true);
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaVerifyCode,
      });

      if (verify.error) throw verify.error;

      alert('2FA successfully enabled!');
      setMfaModalVisible(false);
      setMfaVerifyCode('');
    } catch (e: any) {
      alert('Verification failed: ' + e.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const renderSettingItem = (icon: React.ReactNode, title: string, rightContent?: React.ReactNode, onPress?: () => void) => (
    <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <View className="flex-row items-center">
        <View className="w-8 items-center justify-center mr-3">
          {icon}
        </View>
        <Text className="text-dark font-inter text-sm">{title}</Text>
      </View>
      <View className="flex-row items-center">
        {rightContent}
        <ChevronRight size={16} color="#9ca3af" className="ml-2" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="mb-6">
          <Text className="text-dark font-poppins text-2xl">Settings</Text>
        </View>

        {/* Profile Card */}
        <View className="bg-white border border-gray-100 rounded-3xl p-5 mb-8 shadow-sm shadow-gray-200/50 flex-row items-center">
          <TouchableOpacity onPress={pickImage} className="w-16 h-16 rounded-full bg-dark items-center justify-center mr-4 overflow-hidden relative">
            <Image 
              source={{ uri: avatarUrl }} 
              className="w-16 h-16" 
              resizeMode="cover" 
            />
            <View className="absolute bottom-0 bg-black/40 w-full items-center py-0.5">
              <Text className="text-white text-[8px] font-inter">EDIT</Text>
            </View>
          </TouchableOpacity>
          <View>
            <Text className="text-dark font-poppins text-lg">{fullName}</Text>
            <Text className="text-gray-500 font-inter text-xs mt-0.5">{businessName}</Text>
            <Text className="text-gray-400 font-inter text-xs mt-0.5">{email}</Text>
            <View className={`mt-1.5 px-2.5 py-0.5 rounded-md self-start ${isOwner ? 'bg-purple-50' : 'bg-blue-50'}`}>
              <Text className={`font-inter text-[10px] font-bold ${isOwner ? 'text-purple-600' : 'text-blue-600'}`}>
                {isOwner ? '👑 Owner' : '👤 Staff'}
              </Text>
            </View>
          </View>
        </View>

        {/* Business Settings */}
        <View className="mb-6">
          <Text className="text-dark font-poppins text-sm mb-3">Business Settings</Text>
          <View className="bg-white border border-gray-100 rounded-3xl px-4 py-1 shadow-sm shadow-gray-200/50">
            {renderSettingItem(<User size={20} color="#64748b" />, "Business Profile", undefined, openEditProfile)}
            {renderSettingItem(<Sliders size={20} color="#64748b" />, "Preferences", undefined, () => Alert.alert("Preferences", "Preferences settings are currently configured to default system standards."))}
            {renderSettingItem(
              <DollarSign size={20} color="#64748b" />, 
              "Currency", 
              <Text className="text-gray-500 font-inter text-xs">BDT (৳)</Text>,
              () => Alert.alert("Currency", "Primary currency is set to BDT (৳) for all inventory sales and reports.")
            )}
          </View>
        </View>

        {/* Team Management — Owner Only */}
        {isOwner && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-dark font-poppins text-sm">Team Members</Text>
              <TouchableOpacity onPress={() => setAddMemberModalVisible(true)}>
                <Text className="text-primary font-inter text-xs font-semibold">+ Add Member</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm shadow-gray-200/50">
              {loadingTeam ? (
                <ActivityIndicator size="small" color="#0F172A" className="py-4" />
              ) : teamMembers.length === 0 ? (
                <Text className="text-gray-400 font-inter text-xs text-center py-4">No team members registered yet.</Text>
              ) : (
                teamMembers.map((member) => (
                  <View key={member.id} className="flex-row justify-between items-center py-3 border-b border-gray-50 last:border-0">
                    <View className="flex-1 mr-2">
                      <Text className="text-dark font-inter text-sm" numberOfLines={1}>{member.email}</Text>
                      <Text className="text-gray-400 font-inter text-[10px] capitalize">{member.role}</Text>
                    </View>
                    {member.email.toLowerCase() !== email.toLowerCase() && (
                      <View className="flex-row items-center">
                        <TouchableOpacity 
                          onPress={() => handleUpdateMemberRole(member.id, member.role)}
                          className="mr-3 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg"
                        >
                          <Text className="text-gray-500 font-inter text-[10px]">Change Role</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleRemoveMember(member.id, member.email)}
                          className="bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg"
                        >
                          <Text className="text-red-500 font-inter text-[10px]">Remove</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Account & Security — Owner Only */}
        {isOwner && (
        <View className="mb-6">
          <Text className="text-dark font-poppins text-sm mb-3">Account & Security</Text>
          <View className="bg-white border border-gray-100 rounded-3xl px-4 py-1 shadow-sm shadow-gray-200/50">
            {renderSettingItem(<Lock size={20} color="#64748b" />, "Change Password", undefined, () => Alert.alert("Change Password", "Password changes can be completed securely from your profile dashboard link.") )}
            {renderSettingItem(<ShieldCheck size={20} color="#64748b" />, "Two-Factor Authentication", undefined, startMfaEnrollment)}
            {renderSettingItem(<Smartphone size={20} color="#64748b" />, "Device Management", undefined, () => Alert.alert("Device Management", `Active Device ID: ${user?.id || 'Unknown'}`)) }
          </View>
        </View>
        )}

        {/* App Settings */}
        <View className="mb-8">
          <Text className="text-dark font-poppins text-sm mb-3">App Settings</Text>
          <View className="bg-white border border-gray-100 rounded-3xl px-4 py-1 shadow-sm shadow-gray-200/50">
            {renderSettingItem(<Bell size={20} color="#64748b" />, "Notifications", undefined, () => Alert.alert("Notifications", "Push notifications are active. Low-stock limits and sales operations will trigger device alerts automatically."))}
            {isOwner && renderSettingItem(
              <RefreshCw size={20} color="#64748b" />, 
              "Backup & Sync", 
              syncing ? <ActivityIndicator size="small" color="#10B981" /> : <Text className="text-gray-500 font-inter text-xs">Ready</Text>, 
              handleSync
            )}
            {isOwner && renderSettingItem(<FileText size={20} color="#64748b" />, "Data Export", undefined, () => router.push('/reports'))}
          </View>
        </View>

        {/* Logout */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 border border-red-100 rounded-3xl px-5 py-4 flex-row items-center justify-center"
          >
            <Text className="text-red-500 font-poppins text-base">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Extra spacing for Bottom Bar */}
        <View className="h-24" />
      </ScrollView>

      <BottomNav currentRoute="/settings" />

      {/* 2FA Enrollment Modal */}
      <Modal
        visible={mfaModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMfaModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white px-6 py-8">
          <Text className="text-3xl font-poppins text-dark text-center mb-2">Enable 2FA</Text>
          <Text className="text-gray-500 font-inter text-center mb-8">Scan this QR code with your Authenticator app (like Google Authenticator or Authy).</Text>
          
          <View className="items-center justify-center bg-gray-50 rounded-3xl py-8 mb-8 border border-gray-200">
            {mfaLoading && !qrCodeUrl ? (
              <ActivityIndicator size="large" color="#0F172A" />
            ) : qrCodeUrl ? (
              <QRCode value={qrCodeUrl} size={200} />
            ) : null}
          </View>

          <Text className="text-dark font-poppins text-sm text-center mb-3">Enter the 6-digit code to verify</Text>
          <View className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center mb-6">
            <TextInput 
              className="flex-1 font-poppins text-dark text-2xl tracking-[0.5em] text-center" 
              placeholder="000000" 
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={6}
              value={mfaVerifyCode}
              onChangeText={setMfaVerifyCode}
            />
          </View>

          <TouchableOpacity 
            className="bg-primary rounded-xl py-4 items-center shadow-sm shadow-primary/30"
            activeOpacity={0.8}
            onPress={verifyMfaEnrollment}
            disabled={mfaLoading || !qrCodeUrl || mfaVerifyCode.length < 6}
          >
            <Text className="text-white font-poppins text-lg">
              {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setMfaModalVisible(false)} className="mt-6 items-center">
            <Text className="text-gray-500 font-inter text-base">Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          className="flex-1 bg-white"
        >
          <SafeAreaView className="flex-1 px-6 py-8">
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <Text className="text-3xl font-poppins text-dark text-center mb-2">Edit Profile</Text>
              <Text className="text-gray-500 font-inter text-center mb-8">Update your personal details and business settings below.</Text>
              
              {/* Full Name */}
              <Text className="text-dark font-inter text-sm mb-2">Full Name</Text>
              <View className="border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-gray-50">
                <TextInput 
                  className="font-inter text-dark text-base" 
                  placeholder="Full Name" 
                  placeholderTextColor="#9ca3af"
                  value={editFullName}
                  onChangeText={setEditFullName}
                />
              </View>

              {/* Business Name */}
              <Text className="text-dark font-inter text-sm mb-2">Business Name</Text>
              <View className="border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-gray-50">
                <TextInput 
                  className="font-inter text-dark text-base" 
                  placeholder="Business Name" 
                  placeholderTextColor="#9ca3af"
                  value={editBusinessName}
                  onChangeText={setEditBusinessName}
                />
              </View>

              {/* Role Selection */}
              <Text className="text-dark font-inter text-sm mb-2">Your Role</Text>
              {isOwner ? (
                <>
                  <View className="flex-row mb-6">
                    <TouchableOpacity 
                      onPress={() => setEditRole('owner')}
                      className={`flex-1 py-3.5 rounded-xl border mr-2 items-center justify-center ${editRole === 'owner' ? 'bg-purple-50 border-purple-500' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <Text className={`font-poppins text-sm ${editRole === 'owner' ? 'text-purple-600 font-bold' : 'text-gray-500'}`}>👑 Owner</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setEditRole('staff')}
                      className={`flex-1 py-3.5 rounded-xl border ml-2 items-center justify-center ${editRole === 'staff' ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <Text className={`font-poppins text-sm ${editRole === 'staff' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>👤 Staff</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-xs text-gray-400 font-inter mb-8 text-center">
                    Note: Updating your role to Owner grants full access to backups, security options, and financial reports.
                  </Text>
                </>
              ) : (
                <View className="border border-gray-200 rounded-xl px-4 py-3.5 mb-6 bg-gray-50 flex-row items-center">
                  <Text className="font-poppins text-gray-500 text-sm">👤 Staff (Role cannot be changed by staff)</Text>
                </View>
              )}

              <TouchableOpacity 
                className="bg-[#0F172A] rounded-xl py-4 items-center shadow-sm shadow-[#0F172A]/30"
                activeOpacity={0.8}
                onPress={handleUpdateProfile}
                disabled={savingProfile}
              >
                <Text className="text-white font-poppins text-lg">
                  {savingProfile ? 'Saving Changes...' : 'Save Profile'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setProfileModalVisible(false)} className="mt-6 items-center">
                <Text className="text-gray-500 font-inter text-base">Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={addMemberModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddMemberModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          className="flex-1 bg-white"
        >
          <SafeAreaView className="flex-1 px-6 py-8">
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <Text className="text-3xl font-poppins text-dark text-center mb-2">Add Team Member</Text>
              <Text className="text-gray-500 font-inter text-center mb-8">Authorize a staff member or co-owner to access your business data.</Text>
              
              {/* Member Email */}
              <Text className="text-dark font-inter text-sm mb-2">Member Email</Text>
              <View className="border border-gray-300 rounded-xl px-4 py-3 mb-6 bg-gray-50">
                <TextInput 
                  className="font-inter text-dark text-base" 
                  placeholder="employee@jamilcreation.com" 
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newMemberEmail}
                  onChangeText={setNewMemberEmail}
                />
              </View>

              {/* Role Selection */}
              <Text className="text-dark font-inter text-sm mb-2">Assigned Role</Text>
              <View className="flex-row mb-6">
                <TouchableOpacity 
                  onPress={() => setNewMemberRole('owner')}
                  className={`flex-1 py-3.5 rounded-xl border mr-2 items-center justify-center ${newMemberRole === 'owner' ? 'bg-purple-50 border-purple-500' : 'bg-gray-50 border-gray-200'}`}
                >
                  <Text className={`font-poppins text-sm ${newMemberRole === 'owner' ? 'text-purple-600 font-bold' : 'text-gray-500'}`}>👑 Owner</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setNewMemberRole('staff')}
                  className={`flex-1 py-3.5 rounded-xl border ml-2 items-center justify-center ${newMemberRole === 'staff' ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'}`}
                >
                  <Text className={`font-poppins text-sm ${newMemberRole === 'staff' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>👤 Staff</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-gray-400 font-inter mb-8 text-center">
                Owner role grants privileges (sync, reports, delete records). Staff role limits access to catalog and entry tasks.
              </Text>

              <TouchableOpacity 
                className="bg-[#0F172A] rounded-xl py-4 items-center shadow-sm shadow-[#0F172A]/30"
                activeOpacity={0.8}
                onPress={handleAddMember}
                disabled={savingMember}
              >
                <Text className="text-white font-poppins text-lg">
                  {savingMember ? 'Adding Member...' : 'Add Member'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setAddMemberModalVisible(false)} className="mt-6 items-center">
                <Text className="text-gray-500 font-inter text-base">Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
