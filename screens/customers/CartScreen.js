import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { serverurl } from '../../server/Config'; 

const API_URL = serverurl + '/Carts';
const ORDER_API_URL = serverurl + '/Orders';
const USER_API_URL = serverurl + '/users';

const CartScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [tempAddress, setTempAddress] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const navigation = useNavigation();

  // Luôn reload giỏ hàng khi màn hình được focus
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const loadCustomerUsernameAndCart = async () => {
        try {
          const usern = await AsyncStorage.getItem('CurrentUsername');
          if (usern && isActive) {
            setUsername(usern);
            const response = await axios.get(`${API_URL}/${usern}`);
            setCartItems(response.data);

            // Lấy thông tin user
            const userRes = await axios.get(`${USER_API_URL}/${usern}`);
            setUserInfo(userRes.data);
          }
        } catch (error) {
          console.error('Lỗi khi tải giỏ hàng:', error.message);
          Alert.alert('Lỗi', 'Không thể tải giỏ hàng.');
        } finally {
          if (isActive) setLoading(false);
        }
      };
      setLoading(true);
      loadCustomerUsernameAndCart();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      confirmDeleteItem(productId);
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/${username}/${productId}`,
        { quantity: newQuantity }
      );
      const updated = response.data.item;
      setCartItems((prev) =>
        prev.map((item) =>
          item.product._id === productId ? updated : item
        )
      );
    } catch (err) {
      console.error('Lỗi cập nhật số lượng:', err.message);
      Alert.alert('Lỗi', 'Không thể cập nhật số lượng');
    }
  };

  const confirmDeleteItem = (productId) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa sản phẩm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteItem(productId),
        },
      ]
    );
  };

  const deleteItem = async (productId) => {
    try {
      await axios.delete(`${API_URL}/${username}/${productId}`);
      setCartItems((prev) =>
        prev.filter((item) => item.product._id !== productId)
      );
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err.message);
      Alert.alert('Lỗi', 'Không thể xóa sản phẩm');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => {
      if (item.product && typeof item.product.price === 'number') {
        return sum + item.product.price * item.quantity;
      }
      return sum;
    }, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng trống!');
      return;
    }

    // Kiểm tra số điện thoại và địa chỉ
    const phone = userInfo?.phone;
    const addresses = userInfo?.addresses || [];
    if (!phone || phone.trim() === '' || !addresses.length) {
      setTempPhone(phone || '');
      setTempAddress('');
      setShowUserInfoModal(true);
      return;
    }

    // Nếu chưa chọn địa chỉ, yêu cầu chọn
    if (!selectedAddress) {
      setShowUserInfoModal(true);
      setTempPhone(phone);
      setTempAddress('');
      return;
    }

    try {
      // Gửi đơn hàng lên MongoDB Atlas, LƯU ĐỊA CHỈ ĐÃ CHỌN VÀ STATUS
      const orderData = {
        username,
        items: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        total: getTotalPrice(),
        phone: phone,
        address: selectedAddress, // Địa chỉ mua hàng đã chọn
        status: 'Chờ xác nhận',   // Thêm status khi tạo mới
      };
      const response = await axios.post(ORDER_API_URL, orderData);

      if (response.data && response.data.success) {
        await axios.delete(`${API_URL}/${username}`);
        navigation.navigate('Đơn hàng', { username });
        setCartItems([]);
        setSelectedAddress('');
        Alert.alert('Thành công', 'Đơn hàng đã được đặt!');
      } else {
        throw new Error('Không thể tạo đơn hàng');
      }
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error.message);
      Alert.alert('Lỗi', 'Không thể đặt hàng!');
    }
  };

  // Hàm lưu thông tin người dùng khi thiếu
  const handleSaveUserInfo = async () => {
    if (!tempPhone.trim() || !tempAddress.trim()) {
      Alert.alert('Lưu ý', 'Vui lòng nhập đầy đủ số điện thoại và địa chỉ.');
      return;
    }
    setSavingInfo(true);
    try {
      // Cập nhật user
      const res = await axios.put(`${USER_API_URL}/${username}`, {
        phone: tempPhone,
        addresses: [tempAddress],
      });
      setUserInfo(res.data);
      setShowUserInfoModal(false);
      setSavingInfo(false);
      setSelectedAddress(tempAddress);
      setTimeout(() => {
        handleCheckout();
      }, 300);
    } catch (err) {
      setSavingInfo(false);
      Alert.alert('Lỗi', 'Không thể lưu thông tin');
    }
  };

  const renderItem = ({ item }) => {
    if (!item.product) {
      return (
        <View style={styles.cartItem}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { color: 'red' }]}>
              ❌ Sản phẩm đã bị xóa
            </Text>
            <Text style={styles.itemPrice}>Số lượng: {item.quantity}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cartItem}>
        <Image
          source={
            item.product.image
              ? { uri: item.product.image }
              : require('../../assets/no-image.png')
          }
          style={styles.itemImage}
          resizeMode="cover"
          onError={() => {}}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.product.name}</Text>
          <Text style={styles.itemPrice}>
            {item.product.price.toLocaleString()} VND
          </Text>
          <View style={styles.itemQuantityRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.quantityBtn}
                disabled={item.quantity === 1}
                onPress={() => updateQuantity(item.product._id, item.quantity - 1)}
              >
                <Text style={styles.quantityBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => updateQuantity(item.product._id, item.quantity + 1)}
              >
                <Text style={styles.quantityBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotal}>
              {(item.product.price * item.quantity).toLocaleString()} VND
            </Text>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => confirmDeleteItem(item.product._id)}
            >
              <Text style={styles.removeBtnText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Chừa một khoảng nhỏ ở trên cùng */}
      <View style={{ height: 10 }} />
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4a90e2"
          style={{ marginTop: 50 }}
        />
      ) : cartItems.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 50 }}>
          Giỏ hàng trống
        </Text>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
          />

          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.totalText}>
                Tổng cộng: 💵 {getTotalPrice()} VND
              </Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {userInfo?.addresses?.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.addressSelectBtn,
                      { borderColor: selectedAddress ? '#4a90e2' : '#ce7e63' }
                    ]}
                    onPress={() => setShowUserInfoModal(true)}
                  >
                    <Text style={{
                      color: selectedAddress ? '#4a90e2' : '#ce7e63',
                      fontWeight: '600',
                      fontSize: 13,
                    }}>
                      {selectedAddress ? '📍 ' + selectedAddress : 'Chọn địa chỉ'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={async () => {
                if (!selectedAddress) {
                  Alert.alert('Lưu ý', 'Vui lòng chọn địa chỉ giao hàng!');
                  return;
                }
                Alert.alert(
                  'Xác nhận',
                  `Bạn chắc chắn muốn mua hàng với địa chỉ:\n${selectedAddress}?`,
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xác nhận',
                      style: 'default',
                      onPress: handleCheckout,
                    },
                  ]
                );
              }}
            >
              <Text style={styles.checkoutText}>Mua hàng</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal visible={showUserInfoModal} transparent animationType="fade">
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%'
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: '#ce7e63' }}>
              {userInfo?.addresses?.length
                ? 'Chọn địa chỉ giao hàng'
                : 'Nhập thông tin để thanh toán'}
            </Text>
            {/* Nếu user đã có địa chỉ, cho chọn địa chỉ */}
            {userInfo?.addresses?.length ? (
              <>
                <Text style={{ marginBottom: 8 }}>Số điện thoại: {userInfo.phone}</Text>
                {userInfo.addresses.map((addr, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      borderWidth: 1.5,
                      borderColor: selectedAddress === addr ? '#4a90e2' : '#ddd',
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 8,
                      backgroundColor: selectedAddress === addr ? '#eaf6ff' : '#fff',
                    }}
                    onPress={() => {
                      setSelectedAddress(addr);
                      setShowUserInfoModal(false);
                    }}
                  >
                    <Text style={{ color: '#333' }}>{addr}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.checkoutButton, { backgroundColor: '#aaa', marginTop: 8 }]}
                  onPress={() => setShowUserInfoModal(false)}
                >
                  <Text style={styles.checkoutText}>Đóng</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={[styles.input, { marginBottom: 10 }]}
                  placeholder="Số điện thoại"
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#bbb"
                />
                <TextInput
                  style={[styles.input, { marginBottom: 10 }]}
                  placeholder="Địa chỉ giao hàng"
                  value={tempAddress}
                  onChangeText={setTempAddress}
                  placeholderTextColor="#bbb"
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.checkoutButton, { marginRight: 8, backgroundColor: '#ce7e63' }]}
                    onPress={handleSaveUserInfo}
                    disabled={savingInfo}
                  >
                    <Text style={styles.checkoutText}>{savingInfo ? 'Đang lưu...' : 'Lưu & Chọn'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.checkoutButton, { backgroundColor: '#aaa' }]}
                    onPress={() => setShowUserInfoModal(false)}
                    disabled={savingInfo}
                  >
                    <Text style={styles.checkoutText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f5f3',
    padding: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ce7e63',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  cartList: {
    paddingBottom: 120,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#ce7e63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#f3e9e2',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4e342e',
    marginBottom: 2,
  },
  itemPrice: {
    color: '#ce7e63',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  itemQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Thêm dòng này
    marginTop: 4,
    gap: 10,
  },
  quantityBtn: {
    backgroundColor: '#ffe0b2',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginHorizontal: 2,
  },
  quantityBtnText: {
    fontSize: 18,
    color: '#ce7e63',
    fontWeight: 'bold',
  },
  itemTotal: {
    fontWeight: 'bold',
    color: '#4a90e2',
    fontSize: 15,
    marginLeft: 8,
    minWidth: 80, // Thêm minWidth để tổng tiền luôn đủ rộng
    textAlign: 'right',
  },
  removeBtn: {
    marginLeft: 8,
    backgroundColor: '#ef9a9a',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    shadowColor: '#ce7e63',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4e342e',
  },
  addressSelectBtn: {
    borderWidth: 1.2,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderColor: '#ce7e63',
  },
  checkoutButton: {
    marginTop: 10,
    backgroundColor: '#ce7e63',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#ce7e63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 4,
  },
  checkoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#4e342e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    shadowColor: '#ce7e63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 12,
    color: '#ce7e63',
    textAlign: 'center',
  },
});
