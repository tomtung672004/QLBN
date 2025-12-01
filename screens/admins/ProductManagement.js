import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';
import { serverurl } from '../../server/Config'; 
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

// -----------------------------
// URL BACKEND
// -----------------------------
const serverUrl = serverurl; // Đã sửa endpoint

// -----------------------------
// MÀN HÌNH DANH SÁCH SẢN PHẨM & LOẠI SẢN PHẨM
// -----------------------------
const ProductListScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCategory, setShowCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editCatIndex, setEditCatIndex] = useState(null);
  const [editCatValue, setEditCatValue] = useState('');

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${serverUrl}/Drinks`);
      setProducts(response.data);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${serverUrl}/Categories`);
      setCategories(res.data);
    } catch (error) {
      setCategories([]);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
      fetchCategories();
    });
    return unsubscribe;
  }, [navigation]);

  // Category CRUD
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await axios.post(`${serverUrl}/Categories`, { name: newCategory.trim() });
      setNewCategory('');
      setCatModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.log('Lỗi thêm loại sản phẩm:', error?.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể thêm loại sản phẩm');
    }
  };

  const handleEditCategory = async (index) => {
    if (!editCatValue.trim()) return;
    try {
      const cat = categories[index];
      await axios.put(`${serverUrl}/Categories/${cat._id}`, { name: editCatValue.trim() });
      setEditCatIndex(null);
      setEditCatValue('');
      fetchCategories();
    } catch {
      Alert.alert('Lỗi', 'Không thể sửa loại sản phẩm');
    }
  };

  const handleDeleteCategory = async (index) => {
    try {
      const cat = categories[index];
      await axios.delete(`${serverUrl}/Categories/${cat._id}`);
      fetchCategories();
    } catch {
      Alert.alert('Lỗi', 'Không thể xóa loại sản phẩm');
    }
  };

  const handleDelete = async (productId) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa sản phẩm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${serverUrl}/Drinks/${productId}`);
              fetchProducts(); // Refresh lại danh sách sản phẩm
              Alert.alert('Thành công', 'Đã xóa sản phẩm.');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.itemImage} />
      )}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>{item.price} VNĐ</Text>
        {item.description ? (
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: '#b77b57' }]}
        onPress={() => navigation.navigate('EditProduct', { product: item })}
      >
        {/* Đổi icon thành bút chì đơn giản */}
        <Text style={styles.actionBtnText}>✎</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: '#a0522d', marginLeft: 6 }]}
        onPress={() => handleDelete(item._id)}
      >
        {/* Đổi icon thành dấu X đơn giản */}
        <Text style={styles.actionBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  // UI
  return (
    <View style={styles.container}>
      {/* Khoảng trống nhỏ trên cùng */}
      <View style={{ height: 40 }} />

      {/* Header: Sản phẩm | Loại */}
      <View style={styles.headerRow}>
        <Text
          style={[styles.headerTitle, !showCategory && styles.headerActive]}
          onPress={() => setShowCategory(false)}
        >
          Sản phẩm
        </Text>
        <Text style={styles.headerDivider}>|</Text>
        <Text
          style={[styles.headerTitle, showCategory && styles.headerActive]}
          onPress={() => setShowCategory(true)}
        >
          Loại
        </Text>
      </View>

      {/* Không dùng Animated.View nữa, chỉ render theo showCategory */}
      {!showCategory ? (
        <View style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#4a90e2" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={products}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50 }}>Chưa có sản phẩm nào</Text>}
              renderItem={renderItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 12 }}
            />
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.categoryContainer}>
            <FlatList
              data={categories}
              keyExtractor={(item) => item._id}
              renderItem={({ item, index }) => (
                <View style={styles.catItemRow}>
                  {editCatIndex === index ? (
                    <>
                      <TextInput
                        value={editCatValue}
                        onChangeText={setEditCatValue}
                        style={styles.catInput}
                        autoFocus
                      />
                      <TouchableOpacity onPress={() => handleEditCategory(index)}>
                        <Text style={styles.catAction}>✔</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setEditCatIndex(null); setEditCatValue(''); }}>
                        <Text style={styles.catAction}>✕</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.catName}>{item.name}</Text>
                      <TouchableOpacity onPress={() => { setEditCatIndex(index); setEditCatValue(item.name); }}>
                        <Text style={styles.catAction}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteCategory(index)}>
                        <Text style={styles.catAction}>✕</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>Chưa có loại sản phẩm nào</Text>}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
            {/* Nút + nổi cùng vị trí và kích thước với FAB ở trang sản phẩm */}
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setCatModalVisible(true)}
            >
              <Text style={styles.fabText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal thêm loại sản phẩm */}
      <Modal visible={catModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm loại sản phẩm</Text>
            <TextInput
              placeholder="Tên loại sản phẩm"
              value={newCategory}
              onChangeText={setNewCategory}
              style={styles.catInput}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity style={styles.catModalBtn} onPress={handleAddCategory}>
                <Text style={styles.catModalBtnText}>Thêm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.catModalBtn, { backgroundColor: '#eee', marginLeft: 10 }]}
                onPress={() => { setCatModalVisible(false); setNewCategory(''); }}
              >
                <Text style={[styles.catModalBtnText, { color: '#a0522d' }]}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB thêm sản phẩm chỉ hiển thị khi ở tab sản phẩm */}
      {!showCategory && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// -----------------------------
// MÀN HÌNH THÊM SẢN PHẨM
// -----------------------------
const AddProductScreen = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePublicIdInput, setImagePublicIdInput] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    axios.get(`${serverurl}/Categories`)
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  const handlePickImage = () => {
    pickAndUploadImage(setImageUrlInput, setImagePublicIdInput, setUploading);
  };

  const handleAdd = async () => {
    if (!name || !price) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và giá sản phẩm.');
      return;
    }
    if (!imageUrlInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chọn ảnh sản phẩm.');
      return;
    }
    if (!category) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại sản phẩm.');
      return;
    }

    try {
      const newProduct = {
        name,
        price: parseFloat(price),
        image: imageUrlInput,
        imagePublicId: imagePublicIdInput,
        description,
        category,
      };
      await axios.post(`${serverUrl}/Drinks`, newProduct);

      Alert.alert('Thành công', 'Đã thêm sản phẩm mới.');
      navigation.goBack();
    } catch (error) {
      console.error('Lỗi thêm sản phẩm:', error.message);
      Alert.alert('Lỗi', 'Không thể thêm sản phẩm.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        placeholder="Tên sản phẩm"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Giá (VNĐ)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Mô tả sản phẩm"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />
      {/* Picker chọn loại sản phẩm */}
      <View style={styles.pickerInput}>
        <Picker
          selectedValue={category}
          onValueChange={setCategory}
          style={styles.picker}
          dropdownIconColor="#a0522d"
        >
          <Picker.Item label="Chọn loại sản phẩm..." value="" color="#888" />
          {categories.map(cat => (
            <Picker.Item key={cat._id} label={cat.name} value={cat._id} color="#4e342e" />
          ))}
        </Picker>
      </View>
      {/*
      <TouchableOpacity style={styles.button} onPress={handlePickImage}>
        <Text style={styles.buttonText}>Chọn ảnh sản phẩm</Text>
      </TouchableOpacity>
      */}
      <View style={styles.imageInputWrapper}>
        <TouchableOpacity style={styles.imageInputBtn} onPress={handlePickImage}>
          {imageUrlInput ? (
            <Image source={{ uri: imageUrlInput }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={32} color="#bbb" />
              <Text style={styles.imagePlaceholderText}>Thêm ảnh sản phẩm</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      {uploading && <ActivityIndicator size="small" color="#a0522d" />}
      {/*
      {imageUrlInput ? (
        <Image source={{ uri: imageUrlInput }} style={styles.imagePicker} resizeMode="cover" />
      ) : (
        <View style={styles.imagePicker}>
          <Text style={{ color: '#888' }}>Chưa có ảnh sản phẩm</Text>
        </View>
      )}
      */}
      <TouchableOpacity style={styles.button} onPress={handleAdd}>
        <Text style={styles.buttonText}>Thêm sản phẩm</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// -----------------------------
// MÀN HÌNH SỬA SẢN PHẨM
// -----------------------------
const EditProductScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [description, setDescription] = useState(product.description || '');
  const [imageUrlInput, setImageUrlInput] = useState(product.image || '');
  const [imagePublicIdInput, setImagePublicIdInput] = useState(''); // thêm state cho public_id
  const [category, setCategory] = useState(product.category || '');
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    axios.get(`${serverUrl}/Categories`)
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  const handlePickImage = async () => {
    setUploading(true);
    try {
      const url = await pickAndUploadImage(setImageUrlInput, setImagePublicIdInput, setUploading);
      if (url) setImageUrlInput(url);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể upload ảnh!');
    }
    setUploading(false);
  };

  const handleUpdate = async () => {
    if (!name || !price) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và giá sản phẩm.');
      return;
    }
    if (!imageUrlInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập URL ảnh sản phẩm.');
      return;
    }
    if (!category) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại sản phẩm.');
      return;
    }
    try {
      const updatedProduct = {
        name,
        price: parseFloat(price),
        image: imageUrlInput.trim(),
        imagePublicId: imagePublicIdInput, // thêm trường này
        description,
        category,
      };
      await axios.put(`${serverUrl}/Drinks/${product._id}`, updatedProduct);
      Alert.alert('Thành công', 'Đã cập nhật sản phẩm.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật sản phẩm.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        placeholder="Tên sản phẩm"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Giá (VNĐ)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Mô tả sản phẩm"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />
      {/* Picker chọn loại sản phẩm */}
      <View style={styles.pickerInput}>
        <Picker
          selectedValue={category}
          onValueChange={setCategory}
          style={styles.picker}
          dropdownIconColor="#a0522d"
        >
          <Picker.Item label="Chọn loại sản phẩm..." value="" color="#888" />
          {categories.map(cat => (
            <Picker.Item key={cat._id} label={cat.name} value={cat._id} color="#4e342e" />
          ))}
        </Picker>
      </View>
      {/* Picker chọn/chụp ảnh sản phẩm */}
      <View style={styles.imageInputWrapper}>
        <TouchableOpacity style={styles.imageInputBtn} onPress={handlePickImage}>
          {imageUrlInput ? (
            <Image source={{ uri: imageUrlInput }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={32} color="#bbb" />
              <Text style={styles.imagePlaceholderText}>Thêm ảnh sản phẩm</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      {uploading && <ActivityIndicator size="small" color="#a0522d" />}
      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Cập nhật sản phẩm</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// -----------------------------
// STACK CHUYỂN MÀN HÌNH
// -----------------------------
const Stack = createNativeStackNavigator();

const ProductManagement = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ headerShown: false }} // Ẩn header trên cùng
      />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Thêm sản phẩm' }} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Sửa sản phẩm' }} />
    </Stack.Navigator>
  );
};

export default ProductManagement;

// -----------------------------
// STYLES
// -----------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbeee6',
    // paddingHorizontal: 0, // Đảm bảo không có padding ngang
    // paddingVertical: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10, // giảm padding
    marginBottom: 10, // giảm margin
    borderRadius: 14, // giảm bo tròn
    backgroundColor: '#fff8f0',
    shadowColor: '#795548',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 5,
    elevation: 2,
  },
  itemImage: {
    width: 54, // giảm kích thước ảnh
    height: 54,
    marginRight: 12,
    borderRadius: 10,
    backgroundColor: '#f0e5cf',
    borderWidth: 1,
    borderColor: '#e0c3a0',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4e342e',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 14,
    color: '#d35400',
    fontWeight: '600',
    marginBottom: 2,
  },
  desc: {
    color: '#795548',
    fontSize: 12,
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
  imagePicker: {
    height: 120,
    backgroundColor: '#f0e5cf',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  imageInputWrapper: {
    marginBottom: 18,
  },
  imageInputBtn: {
    backgroundColor: '#f0e5cf',
    borderRadius: 10,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0c3a0',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  imagePlaceholderText: {
    color: '#bbb',
    fontSize: 15,
    marginTop: 6,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
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
  actionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  categoryContainer: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  catHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  catHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a0522d',
  },
  catAddBtn: {
    backgroundColor: '#a0522d',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  catAddText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  catItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbeee6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  catName: {
    flex: 1,
    fontSize: 15,
    color: '#4e342e',
    fontWeight: '600',
  },
  catAction: {
    fontSize: 18,
    color: '#a0522d',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  catInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12, // tăng padding dọc
    paddingHorizontal: 14, // tăng padding ngang
    fontSize: 16,          // tăng font
    color: '#4e342e',
    borderWidth: 1,
    borderColor: '#e0c3a0',
    marginRight: 8,
    minHeight: 44,         // đảm bảo chiều cao tối thiểu
  },
  pickerInput: {
    backgroundColor: '#fff8f0',
    borderRadius: 10,
    marginBottom: 16,
    height: 54,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0c3a0',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 54,
    color: '#4e342e',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff8f0',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a0522d',
    marginBottom: 16,
  },
  catModalBtn: {
    backgroundColor: '#a0522d',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  catModalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  imageInputWrapper: {
    marginBottom: 18,
  },
  imageInputBtn: {
    backgroundColor: '#f0e5cf',
    borderRadius: 10,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0c3a0',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  imagePlaceholderText: {
    color: '#bbb',
    fontSize: 15,
    marginTop: 6,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
});

// Hàm chọn/chụp ảnh và upload lên Cloudinary qua backend
const pickAndUploadImage = async (setImageUrlInput, setImagePublicIdInput, setUploading) => {
  try {
    setUploading(true);

    // Chọn/chụp ảnh
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      quality: 0.7,
    });

    if (result.canceled) {
      setUploading(false);
      return;
    }

    // Resize/nén ảnh
    const manipResult = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 600, height: 600 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    const base64data = manipResult.base64;

    // Upload lên backend
    const res = await axios.post(`${serverurl}/products/upload-image`, {
      imageBase64: base64data
    });

    setImageUrlInput(res.data.imageUrl);
    setImagePublicIdInput(res.data.publicId);
    setUploading(false);
  } catch (err) {
    setUploading(false);
    Alert.alert('Lỗi', 'Không thể upload ảnh!');
  }
};
