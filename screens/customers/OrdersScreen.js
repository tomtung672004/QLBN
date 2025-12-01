import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { serverurl } from '../../server/Config'; 
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons'; // Nếu dùng Expo, hoặc dùng react-native-vector-icons

const ORDER_API_URL = serverurl + '/orders';

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchOrders = async () => {
        try {
          const username = await AsyncStorage.getItem('CurrentUsername');
          if (!username) {
            if (isActive) setOrders([]);
            if (isActive) setLoading(false);
            return;
          }
          const res = await axios.get(`${ORDER_API_URL}/${username}`);
          if (isActive) setOrders(res.data);
        } catch (error) {
          if (isActive) setOrders([]);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      setLoading(true);
      fetchOrders();
      return () => { isActive = false; };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Không có đơn hàng nào!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Chừa một khoảng nhỏ ở trên cùng */}
      <View style={{ height: 10 }} />
      <FlatList
        data={[...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))}
        keyExtractor={(order) => order._id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderDate}>
                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
              </Text>
              <View style={styles.statusBadge(item.status)}>
                <Text style={styles.statusText}>{item.status || 'Chờ xác nhận'}</Text>
              </View>
            </View>
            <Text style={styles.address}>
              <MaterialIcons name="location-on" size={16} color="#ce7e63" /> {item.address || 'Không có'}
            </Text>
            <View style={styles.divider} />
            <FlatList
              data={item.items}
              keyExtractor={(it, idx) => it.product?._id || idx.toString()}
              renderItem={({ item: prod }) => (
                <View style={styles.productRow}>
                  <Image
                    source={
                      prod.product?.image
                        ? { uri: prod.product.image }
                        : require('../../assets/no-image.png')
                    }
                    style={styles.productImage}
                    resizeMode="cover"
                    onError={() => {}}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{prod.product?.name || 'Sản phẩm đã xóa'}</Text>
                    <Text style={styles.productInfo}>
                      Số lượng: <Text style={{ fontWeight: 'bold' }}>{prod.quantity}</Text>
                    </Text>
                    <Text style={styles.productInfo}>
                      Giá: <Text style={{ color: '#ce7e63' }}>{prod.product?.price || 0} VND</Text>
                    </Text>
                  </View>
                  <Text style={styles.productTotal}>
                    {((prod.product?.price || 0) * prod.quantity).toLocaleString()} VND
                  </Text>
                </View>
              )}
              scrollEnabled={false}
            />
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>{item.total.toLocaleString()} VND</Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f6f5f3',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ce7e63',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#ce7e63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: (status) => ({
    backgroundColor:
      status === 'Đã xác nhận'
        ? '#a5d6a7'
        : status === 'Đã hủy'
        ? '#ef9a9a'
        : '#ffe0b2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-end',
  }),
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
  },
  address: {
    fontSize: 15,
    color: '#555',
    marginBottom: 6,
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#ececec',
    marginVertical: 8,
    borderRadius: 1,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#f9f6f2',
    borderRadius: 8,
    padding: 6,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  productInfo: {
    fontSize: 13,
    color: '#666',
  },
  productTotal: {
    fontWeight: 'bold',
    color: '#ce7e63',
    fontSize: 14,
    marginLeft: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ce7e63',
  },
});