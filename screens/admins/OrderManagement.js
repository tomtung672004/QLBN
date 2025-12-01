import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import axios from 'axios';
import { serverurl } from '../../server/Config';

const STATUS_COLOR = {
  'Chờ xác nhận': '#e67e22',
  'Đã xác nhận': '#27ae60',
  'Đã giao': '#2980b9',
  'Đã hủy': '#c0392b',
};

const STATUS_ICON = {
  'Chờ xác nhận': '⏳',
  'Đã xác nhận': '✅',
  'Đã giao': '🚚',
  'Đã hủy': '❌',
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmed, setShowConfirmed] = useState(false); // Thêm state chuyển tab

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${serverurl}/Orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Lỗi khi tải đơn hàng', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.put(`${serverurl}/Orders/${id}/status`, { status });
      fetchOrders();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
    }
  };

  const renderOrderItems = (items) => (
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      <Text style={{ fontWeight: 'bold', color: '#6d4c41' }}>☕ Sản phẩm trong đơn:</Text>
      {items.map((item, idx) => (
        <View key={idx} style={{ marginLeft: 10, marginBottom: 2 }}>
          <Text style={{ color: '#4e342e' }}>
            - {item.product?.name || 'Sản phẩm'} x {item.quantity}{' '}
            {item.product?.price ? ` (${item.product.price} VNĐ)` : ''}
          </Text>
        </View>
      ))}
    </View>
  );

  // Lọc đơn theo trạng thái
  const filteredOrders = showConfirmed
    ? orders.filter(o => o.status !== 'Chờ xác nhận')
    : orders.filter(o => o.status === 'Chờ xác nhận');

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#a0522d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ height: 30 }} />
      {/* Header tab */}
      <View style={styles.headerRow}>
        <Text
          style={[styles.headerTitle, !showConfirmed && styles.headerActive]}
          onPress={() => setShowConfirmed(false)}
        >
          Chờ xác nhận
        </Text>
        <Text style={styles.headerDivider}>|</Text>
        <Text
          style={[styles.headerTitle, showConfirmed && styles.headerActive]}
          onPress={() => setShowConfirmed(true)}
        >
          Đã xác nhận
        </Text>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedOrderId(selectedOrderId === item._id ? null : item._id)}
          >
            <View style={styles.item}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.customerName}>👤 {item.username}</Text>
                  <Text style={[
                    styles.status,
                    { color: STATUS_COLOR[item.status] || '#795548' }
                  ]}>
                    {STATUS_ICON[item.status] || '☕'} {item.status}
                  </Text>
                </View>
                <Text style={styles.info}>📞 {item.phone}</Text>
                <Text style={styles.info}>🏠 {item.address}</Text>
                {selectedOrderId === item._id && renderOrderItems(item.items)}
                <Text style={styles.total}>Tổng tiền: {item.total} VNĐ</Text>
                {/* Chỉ hiện nút xác nhận ở tab "Chờ xác nhận" */}
                {!showConfirmed && item.status === 'Chờ xác nhận' && (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => updateOrderStatus(item._id, 'Đã xác nhận')}
                  >
                    <Text style={styles.confirmBtnText}>Xác nhận đơn hàng</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50 }}>Không có đơn hàng</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#a0522d']} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 10,
    backgroundColor: '#fbeee6',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#fff8f0',
    shadowColor: '#795548',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 5,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4e342e',
  },
  status: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  info: {
    color: '#795548',
    marginTop: 2,
    fontSize: 14,
  },
  total: {
    fontWeight: 'bold',
    color: '#d35400',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'flex-end',
  },
  confirmBtn: {
    backgroundColor: '#a0522d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-end',
    shadowColor: '#a0522d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 18,
    color: '#bfae9e',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  headerActive: {
    color: '#a0522d',
    textDecorationLine: 'underline',
  },
  headerDivider: {
    fontSize: 18,
    color: '#bfae9e',
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
});

export default OrderManagement;
