import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import axios from 'axios';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { serverurl } from '../../server/Config'; 
// Đổi lại IP của bạn nếu cần
const serverUrl = serverurl;

const CustomerListScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${serverUrl}/users`);
      // Lọc chỉ lấy khách hàng
      const customers = response.data.filter(user => user.role === 'customer');
      setUsers(customers);
    } catch (error) {
      console.error('Lỗi khi tải khách hàng:', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const handleDelete = async (id) => {
    if (!id) return;
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa khách hàng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${serverUrl}/users/${id}`);
              fetchUsers(); // reload danh sách
            } catch (error) {
              Alert.alert('Lỗi', 'Lỗi khi xóa khách hàng!');
            }
          },
        },
      ]
    );
  };

  const handleLock = async (id, locked) => {
    if (!id) return;
    Alert.alert(
      locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
      locked
        ? 'Bạn có chắc muốn mở khóa tài khoản này?'
        : 'Bạn có chắc muốn khóa tài khoản này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: locked ? 'Mở khóa' : 'Khóa',
          onPress: async () => {
            try {
              await axios.put(`${serverUrl}/users/${id}/lock`, { locked: !locked });
              fetchUsers(); // reload danh sách
            } catch (error) {
              Alert.alert('Lỗi', 'Lỗi khi cập nhật trạng thái tài khoản!');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const hasMany = Array.isArray(item.addresses) && item.addresses.length > 1;
    const showAll = expandedId === item._id;

    return (
      <View style={styles.item}>
        <View>
          <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.phone}>📞 {item.phone || 'Không có số'}</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 2 }}
            onPress={() => {
              if (hasMany) setExpandedId(showAll ? null : item._id);
            }}
            activeOpacity={hasMany ? 0.6 : 1}
          >
            <Text style={[styles.address, { marginTop: 2, marginRight: 2 }]}>🏠</Text>
            <View style={{ flex: 1 }}>
              {showAll && hasMany ? (
                <>
                  <Text style={styles.address}>{item.addresses[0]}</Text>
                  {item.addresses.slice(1).map((addr, idx) => (
                    <Text key={idx} style={styles.address}>{addr}</Text>
                  ))}
                </>
              ) : (
                Array.isArray(item.addresses) && item.addresses.length > 0 ? (
                  <Text
                    style={styles.address}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.addresses[0]}{hasMany ? ' ...' : ''}
                  </Text>
                ) : (
                  <Text style={styles.address}>Không có địa chỉ</Text>
                )
              )}
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#e94f37' }]}
            onPress={() => handleDelete(item._id)}
          >
            <Text style={{ color: '#fff' }}>Xóa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: item.locked ? '#4a90e2' : '#aaa', marginLeft: 8 },
            ]}
            onPress={() => handleLock(item._id, item.locked)}
          >
            <Text style={{ color: '#fff' }}>{item.locked ? 'Mở khóa' : 'Khóa'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ height: 40 }} />
      <FlatList
        data={users}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50 }}>Chưa có khách hàng nào</Text>}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      {/* Đã bỏ nút + và chức năng thêm khách hàng */}
    </View>
  );
};

const Stack = createNativeStackNavigator();

const CustomerManagement = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerList" component={CustomerListScreen} />
    </Stack.Navigator>
  );
};

export default CustomerManagement;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 12,
    backgroundColor: '#fbeee6', // giống ProductManagement
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
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4e342e',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  phone: {
    fontSize: 14,
    marginTop: 2,
    color: '#d35400',
    fontWeight: '600',
  },
  address: {
    fontSize: 13,
    color: '#795548',
    marginTop: 2,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#a0522d',
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#a0522d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 32,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f0e5cf',
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    fontSize: 15,
    color: '#4e342e',
  },
  button: {
    backgroundColor: '#a0522d',
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
    shadowColor: '#a0522d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
});
