import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Modal,
  Button,
  Alert,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { serverurl } from '../../server/Config'; 

const PRODUCT_API_URL = serverurl + '/Drinks';
const CART_API_URL = serverurl + '/Carts';

const HomeScreen = () => {
  const [username, setUsername] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [cartItems, setCartItems] = useState([]);
  const [categoryList, setCategoryList] = useState([]);

  // Luôn reload dữ liệu khi màn hình được focus
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchAll = async () => {
        setLoading(true);
        try {
          const storedUsername = await AsyncStorage.getItem('CurrentUsername');
          if (storedUsername && isActive) {
            setUsername(storedUsername);
            const [productRes, cartRes] = await Promise.all([
              axios.get(PRODUCT_API_URL),
              axios.get(`${CART_API_URL}/${storedUsername}`)
            ]);
            setProducts(productRes.data);
            setFilteredProducts(productRes.data);
            setCartItems(cartRes.data);
            const uniqueCategories = ['All', ...new Set(productRes.data.map(item => item.category))];
            setCategories(uniqueCategories);
          }
        } catch (error) {
          console.error('Lỗi khi tải dữ liệu:', error.message);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchAll();
      return () => { isActive = false; };
    }, [])
  );

  useEffect(() => {
    axios.get(serverurl + '/Categories')
      .then(res => setCategoryList(res.data))
      .catch(() => setCategoryList([]));
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    filterProducts(text, sortOrder, selectedCategory);
  };

  const handleSort = (order) => {
    setSortOrder(order);
    filterProducts(searchText, order, selectedCategory);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    filterProducts(searchText, sortOrder, category);
  };

  const filterProducts = (search, sort, category) => {
    let updated = [...products];

    if (search) {
      updated = updated.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category && category !== 'All') {
      updated = updated.filter(item => item.category === category);
    }

    if (sort === 'asc') {
      updated.sort((a, b) => a.price - b.price);
    } else if (sort === 'desc') {
      updated.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(updated);
  };

  // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
  const isInCart = (productId) => {
    return cartItems.some(item => item.product && item.product._id === productId);
  };

  // Lấy số lượng hiện tại trong giỏ hàng
  const getCartQuantity = (productId) => {
    const found = cartItems.find(item => item.product && item.product._id === productId);
    return found ? found.quantity : 0;
  };

  // Khi thêm vào giỏ hàng, nếu đã có thì tăng số lượng, không tạo mới
  const confirmAddToCart = async () => {
    if (!selectedProduct) return;

    try {
      const existingCartItem = cartItems.find(
        item => item.product && item.product._id === selectedProduct._id
      );

      if (existingCartItem) {
        // Đã có, gọi API cập nhật số lượng
        await axios.put(
          `${CART_API_URL}/${username}/${selectedProduct._id}`,
          { quantity: existingCartItem.quantity + quantity }
        );
      } else {
        // Chưa có, thêm mới
        await axios.post(CART_API_URL, {
          username,
          product: selectedProduct._id,
          quantity,
        });
      }

      Alert.alert('Thành công', `${selectedProduct.name} (${quantity}) đã được thêm vào giỏ hàng.`);
      setModalVisible(false);
      setQuantity(1);

      // Reload lại cart sau khi thêm
      const cartRes = await axios.get(`${CART_API_URL}/${username}`);
      setCartItems(cartRes.data);
    } catch (error) {
      console.error('Lỗi thêm vào giỏ hàng:', error.message);
      Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng.');
    }
  };

  // Chỉ hiện ảnh, tên, giá. Nhấn vào sản phẩm để xem chi tiết và thêm vào giỏ
  const renderItem = ({ item }) => {
    const inCart = isInCart(item._id);
    const cartQty = getCartQuantity(item._id);

    return (
      <TouchableOpacity
        style={[
          styles.cardProduct, // Sử dụng style thẻ giống ProductManagement
          inCart && { borderColor: '#4a90e2', borderWidth: 2 }
        ]}
        onPress={() => {
          setSelectedProduct(item);
          setQuantity(1);
          setModalVisible(true);
        }}
      >
        <Image
          source={item.image ? { uri: item.image } : require('../../assets/no-image.png')}
          style={styles.itemImageProduct} // Sử dụng style ảnh giống ProductManagement
          resizeMode="cover"
          onError={() => {}}
        />
        <View style={{ flex: 1, justifyContent: 'center', width: '100%' }}>
          <Text style={styles.nameProduct} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.priceProduct}>
            {item.price.toLocaleString('vi-VN')} VND
          </Text>
          {item.description ? (
            <Text style={styles.descProduct} numberOfLines={2}>{item.description}</Text>
          ) : null}
        </View>
        {inCart ? (
          <Text style={styles.inCartText}>
            Đã có trong giỏ ({cartQty})
          </Text>
        ) : (
          <View style={{ height: 20 }} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Chừa một khoảng nhỏ ở trên cùng */}
      <View style={{ height: 10 }} />

      <TextInput
        style={styles.searchBar}
        placeholder="Tìm kiếm sản phẩm..."
        value={searchText}
        onChangeText={handleSearch}
        placeholderTextColor="#bfae9e"
      />

      <View style={styles.filterRow}>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={sortOrder}
            style={styles.picker}
            onValueChange={handleSort}
            dropdownIconColor="#ce7e63"
          >
            <Picker.Item label="Sắp xếp" value={null} />
            <Picker.Item label="Giá tăng dần" value="asc" />
            <Picker.Item label="Giá giảm dần" value="desc" />
          </Picker>
        </View>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={handleCategoryChange}
            dropdownIconColor="#ce7e63"
          >
            <Picker.Item label="Tất cả" value="All" />
            {categoryList.map((cat) => (
              <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
            ))}
          </Picker>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4a90e2" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          // BỎ numColumns và columnWrapperStyle để chỉ còn 1 cột
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 50 }}>Không tìm thấy sản phẩm</Text>
          }
        />
      )}

      {/* Modal chi tiết sản phẩm và chọn số lượng */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedProduct && (
              <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
                <Image
                  source={
                    selectedProduct.image
                      ? { uri: selectedProduct.image }
                      : require('../../assets/no-image.png')
                  }
                  style={styles.detailImage}
                />
                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                <Text style={styles.modalPrice}>
                  {selectedProduct.price?.toLocaleString('vi-VN')} VND
                </Text>
                {selectedProduct.description ? (
                  <Text style={styles.modalDesc}>{selectedProduct.description}</Text>
                ) : null}
                <View style={styles.modalDivider} />
                <Text style={styles.modalLabel}>Số lượng</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity(prev => prev + 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.addCartBtn}
                  onPress={confirmAddToCart}
                >
                  <Text style={styles.addCartText}>Thêm vào giỏ hàng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2; // Giữ nguyên chiều rộng

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f5f2',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1.2,
    borderColor: '#ce7e63',
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#ce7e63',
    marginHorizontal: 1,
    minWidth: 120, // Đảm bảo đủ rộng cho chữ "Sắp xếp"
  },
  picker: {
    height: 52, // Tăng chiều cao cho dễ bấm và không bị cắt
    width: '100%',
    color: '#4e342e',
    backgroundColor: 'transparent',
    fontSize: 15, // Đảm bảo không quá lớn
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10, // Giảm khoảng cách giữa các hàng
  },
  cardProduct: {
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
    width: '100%',
    minHeight: 80,
    marginHorizontal: 0,
  },
  itemImageProduct: {
    width: 54,
    height: 54,
    marginRight: 12,
    borderRadius: 10,
    backgroundColor: '#f0e5cf',
    borderWidth: 1,
    borderColor: '#e0c3a0',
  },
  nameProduct: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4e342e',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  priceProduct: {
    fontSize: 14,
    color: '#d35400',
    fontWeight: '600',
    marginBottom: 2,
  },
  descProduct: {
    color: '#795548',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  inCartText: {
    color: '#4a90e2',
    fontWeight: 'bold',
    marginTop: 8, // tăng marginTop để tách biệt với giá
    fontSize: 11,
    backgroundColor: '#eaf6ff',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: 'center',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#ce7e63',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  modalContainer: {
    width: '92%',
    backgroundColor: '#fff8f0',
    padding: 26,
    borderRadius: 20,
    alignItems: 'center',
    maxHeight: '85%',
    shadowColor: '#ce7e63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
    textAlign: 'center',
    color: '#ce7e63',
    letterSpacing: 0.5,
  },
  modalPrice: {
    fontSize: 17,
    color: '#d35400',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 14,
    color: '#795548',
    marginVertical: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalDivider: {
    height: 1,
    width: '80%',
    backgroundColor: '#e0c3a0',
    marginVertical: 12,
    alignSelf: 'center',
    borderRadius: 1,
  },
  modalLabel: {
    fontSize: 15,
    color: '#4e342e',
    fontWeight: '600',
    marginBottom: 6,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 18,
  },
  qtyBtn: {
    backgroundColor: '#fbeee6',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderWidth: 1.2,
    borderColor: '#ce7e63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 26,
    color: '#ce7e63',
    fontWeight: 'bold',
    lineHeight: 28,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4e342e',
    minWidth: 32,
    textAlign: 'center',
  },
  addCartBtn: {
    marginTop: 18,
    backgroundColor: '#ce7e63',
    paddingVertical: 12,
    paddingHorizontal: 38,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    width: '100%',
  },
  addCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: '#fff8f0',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ce7e63',
    width: '100%',
  },
  cancelText: {
    color: '#ce7e63',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
