import React, { useRef, useEffect } from 'react';
import { Animated, View, ViewStyle, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E2E8F0',
          opacity,
        },
        style,
      ]}
    />
  );
}

// ── Pre-built skeleton layouts ─────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, width: 144, marginRight: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
      <Skeleton width={80} height={10} borderRadius={5} style={{ marginBottom: 8 }} />
      <Skeleton width={100} height={22} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width={60} height={10} borderRadius={5} />
    </View>
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 12, marginBottom: 16, flexDirection: 'row', borderWidth: 1, borderColor: '#f1f5f9' }}>
      <Skeleton width={96} height={96} borderRadius={16} style={{ marginRight: 16 }} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Skeleton width="70%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={10} borderRadius={5} style={{ marginBottom: 16 }} />
        <Skeleton width="55%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

export function TransactionItemSkeleton() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
      <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width="60%" height={13} borderRadius={6} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={10} borderRadius={5} />
      </View>
      <Skeleton width={48} height={10} borderRadius={5} />
    </View>
  );
}

export function ReportCardSkeleton() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, marginHorizontal: 20, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' }}>
      <Skeleton width="50%" height={16} borderRadius={6} style={{ marginBottom: 20 }} />
      <Skeleton width="100%" height={192} borderRadius={12} />
    </View>
  );
}
