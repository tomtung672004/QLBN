import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import { serverurl } from '../../server/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReportStatistics = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await axios.get(`${serverurl}/stats`);
      setStats(res.data);
    } catch (error) {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'AuthManagement' }],
      });
    } catch (error) {
      alert('Lỗi khi đăng xuất!');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#a0522d" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#a0522d']} />
      }
    >
      <Text style={styles.title}>📊 Thống kê & Báo cáo</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Tổng số khách hàng:</Text>
        <Text style={styles.value}>{stats?.totalCustomers ?? '--'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Đơn hàng hôm nay:</Text>
        <Text style={styles.value}>{stats?.ordersToday ?? '--'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Doanh thu hôm nay:</Text>
        <Text style={styles.value}>{stats?.revenueToday?.toLocaleString() ?? '--'} VNĐ</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Doanh thu tháng:</Text>
        <Text style={styles.value}>{stats?.revenueMonth?.toLocaleString() ?? '--'} VNĐ</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbeee6',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#a0522d',
    marginBottom: 18,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#fff8f0',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#795548',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 5,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    color: '#4e342e',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#d35400',
    fontWeight: 'bold',
  },
  logoutBtn: {
    marginTop: 30,
    backgroundColor: '#a0522d',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});

export default ReportStatistics;