import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert, TextInput, Modal, Platform, ScrollView } from 'react-native'; // Thêm ScrollView
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import axios from 'axios';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CafeLogo from '../../assets/logo.png'; // Đảm bảo bạn đã lưu ảnh logo này vào thư mục assets
import { serverurl } from '../../server/Config'; 

const USER_API_URL = serverurl + '/users'; // Đúng chữ thường

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editInfo, setEditInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });
  const [showAddresses, setShowAddresses] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [editAddress, setEditAddress] = useState('');
  const [showAddInput, setShowAddInput] = useState(false); // Trạng thái hiển thị ô nhập địa chỉ mới
  const [showChangePwd, setShowChangePwd] = useState(false); // Trạng thái hiển thị modal đổi mật khẩu
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const username = await AsyncStorage.getItem('CurrentUsername');
        if (!username) {
          setLoading(false);
          return;
        }
        const res = await axios.get(`${USER_API_URL}/${username}`);
        const userData = res.data;

        // Kiểm tra avatar còn tồn tại trên ImgBB không
        if (userData.avatar) {
          try {
            await axios.head(userData.avatar); // Nếu ảnh còn, không làm gì
          } catch (err) {
            // Nếu ảnh không còn (404), xóa avatar trên server
            await axios.put(`${USER_API_URL}/${username}`, { avatar: '' });
            userData.avatar = '';
          }
        }

        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh đại diện!');
        }
      }
    })();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    Alert.alert('Đăng xuất', 'Bạn đã đăng xuất thành công!');
    navigation.replace('AuthManagement');
  };

  const openEditModal = () => {
    setEditInfo({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      avatar: user.avatar || '',
    });
    setModalVisible(true);
  };

  // Chọn ảnh đại diện mới
  const pickAvatar = async () => {
    try {
      // Gửi publicId cũ lên backend để xóa ảnh cũ nếu có
      const oldPublicId = user.avatarPublicId;

      // Mở thư viện ảnh, crop vuông, giảm chất lượng
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        quality: 1,
      });

      if (result.canceled) return;

      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const base64data = manipResult.base64;

      // Gửi lên backend để upload Cloudinary và xóa ảnh cũ nếu có
      const res = await axios.post(`${serverurl}/users/${user.username}/upload-avatar`, {
        imageBase64: base64data,
        oldPublicId: oldPublicId || null,
      });

      const { avatar, avatarPublicId } = res.data;

      // Cập nhật avatar và avatarPublicId trên server (MongoDB)
      const updateRes = await axios.put(`${USER_API_URL}/${user.username}`, {
        ...editInfo,
        avatar,
        avatarPublicId,
      });
      setEditInfo({ ...editInfo, avatar, avatarPublicId });
      setUser(updateRes.data);
      Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
    } catch (error) {
      console.log('Lỗi cập nhật avatar:', error?.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện!');
    }
  };

  const handleSave = async () => {
    // Kiểm tra email nếu có nhập
    if (editInfo.email) {
      // Regex kiểm tra định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editInfo.email)) {
        Alert.alert('Lỗi', 'Email không hợp lệ!');
        return;
      }
    }

    // Kiểm tra số điện thoại nếu có nhập
    if (editInfo.phone) {
      // Regex kiểm tra số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0)
      const phoneRegex = /^(0[0-9]{9,10})$/;
      if (!phoneRegex.test(editInfo.phone)) {
        Alert.alert('Lỗi', 'Số điện thoại không hợp lệ!');
        return;
      }
    }

    try {
      const username = user.username;
      const res = await axios.put(`${USER_API_URL}/${username}`, {
        ...editInfo,
        avatar: editInfo.avatar || user.avatar,
      });
      setUser(res.data);
      setModalVisible(false);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin!');
    }
  };

  // Thêm địa chỉ mới
  const handleAddAddress = async () => {
    if (!newAddress.trim()) return;
    const addresses = [...(user.addresses || [])];
    addresses.push(newAddress.trim());
    await saveAddresses(addresses);
    setNewAddress('');
  };

  // Xóa địa chỉ
  const handleDeleteAddress = async (idx) => {
    const addresses = [...(user.addresses || [])];
    addresses.splice(idx, 1);
    await saveAddresses(addresses);
  };

  // Bắt đầu sửa địa chỉ
  const handleStartEdit = (idx) => {
    setEditIndex(idx);
    setEditAddress(user.addresses[idx]);
  };

  // Lưu địa chỉ đã sửa
  const handleSaveEdit = async () => {
    const addresses = [...(user.addresses || [])];
    addresses[editIndex] = editAddress;
    await saveAddresses(addresses);
    setEditIndex(-1);
    setEditAddress('');
  };

  // Lưu addresses lên server
  const saveAddresses = async (addresses) => {
    try {
      const username = user.username;
      // Chỉ truyền các trường cần thiết, không truyền toàn bộ user
      const updateData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        addresses,
      };
      const res = await axios.put(`${USER_API_URL}/${username}`, updateData); // PUT
      setUser(res.data);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật địa chỉ!');
    }
  };

  // Đổi mật khẩu
  const handleChangePwd = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp!');
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải từ 6 ký tự!');
      return;
    }
    try {
      await axios.post(`${USER_API_URL}/${user.username}/change-password`, {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
      setShowChangePwd(false);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (error) {
      Alert.alert('Lỗi', error?.response?.data?.error || 'Không thể đổi mật khẩu!');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ce7e63" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Không tìm thấy thông tin khách hàng!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8f5f2' }}>
      <View style={styles.container}>
        <View style={styles.headerBg}>
          {/* Logo lớn hơn và bỏ chữ Cafe */}
          <Image source={CafeLogo} style={styles.logoImgLarge} resizeMode="contain" />
        </View>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={openEditModal} activeOpacity={0.8}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={48} color="#bbb" />
              </View>
            )}
            <View style={styles.gearIcon}>
              <Ionicons name="settings-sharp" size={22} color="#ce7e63" />
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#ce7e63" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Họ tên:</Text>
            <Text style={styles.infoValue}>
              {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}` : 'Chưa cập nhật'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#ce7e63" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#ce7e63" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Sđt:</Text>
            <Text style={styles.infoValue}>{user.phone || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#ce7e63"
              style={styles.infoIcon}
              onPress={() => setShowAddresses(!showAddresses)}
            />
            {/* Dùng View bọc Text để không có hiệu ứng nhấp nháy khi nhấn */}
            <View style={{}}>
              <Text
                style={styles.infoLabel}
                onPress={() => setShowAddresses(!showAddresses)}
                selectable={false}
                suppressHighlighting={true}
              >
                Địa chỉ:
              </Text>
            </View>
            {/* Nút + và ô nhập địa chỉ chỉ hiện khi showAddInput true */}
            {!showAddInput ? (
              <TouchableOpacity onPress={() => setShowAddInput(true)} style={styles.addCircleBtn}>
                <Ionicons name="add" size={22} color="#4a90e2" />
              </TouchableOpacity>
            ) : (
              <View style={[styles.addAddressInline, { marginBottom: 0, marginTop: 0 }]}>
                <TextInput
                  style={styles.addAddressInputInline}
                  placeholder="Nhập địa chỉ mới"
                  value={newAddress}
                  onChangeText={setNewAddress}
                  placeholderTextColor="#bbb"
                  autoFocus
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (newAddress.trim()) {
                      await handleAddAddress();
                      setShowAddInput(false);
                    } else {
                      setShowAddInput(false);
                    }
                    setNewAddress('');
                  }}
                  style={styles.addCircleBtn}
                >
                  <Ionicons name="checkmark" size={22} color="#4a90e2" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddInput(false);
                    setNewAddress('');
                  }}
                  style={styles.addCircleBtn}
                >
                  <Ionicons name="close" size={22} color="#ce7e63" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {showAddresses && (
            <View style={styles.addressListModern}>
              {(user.addresses || []).map((addr, idx) => (
                <View key={idx} style={styles.addressItemModern}>
                  <Ionicons name="location-sharp" size={18} color="#ce7e63" style={{ marginRight: 6 }} />
                  {editIndex === idx ? (
                    <>
                      <TextInput
                        style={styles.addAddressInputInline}
                        value={editAddress}
                        onChangeText={setEditAddress}
                        autoFocus
                        placeholder="Nhập địa chỉ"
                        placeholderTextColor="#bbb"
                      />
                      <TouchableOpacity
                        onPress={async () => {
                          if (editAddress.trim()) {
                            await handleSaveEdit();
                          }
                        }}
                        style={styles.addCircleBtn}
                      >
                        <Ionicons name="checkmark-circle-outline" size={22} color="#4a90e2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setEditIndex(-1);
                          setEditAddress('');
                        }}
                        style={styles.addCircleBtn}
                      >
                        <Ionicons name="close-circle-outline" size={22} color="#ce7e63" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.addressText}>{addr}</Text>
                      <TouchableOpacity
                        onPress={() => handleStartEdit(idx)}
                        style={styles.iconBtn}
                      >
                        <Ionicons name="create-outline" size={20} color="#4a90e2" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteAddress(idx)} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={20} color="#ce7e63" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.changePwdBtn} onPress={() => setShowChangePwd(true)}>
          <Ionicons name="key-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Đổi mật khẩu</Text>
        </TouchableOpacity>

        {/* Modal cập nhật thông tin */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cập nhật thông tin</Text>
              <TouchableOpacity onPress={pickAvatar} style={{ alignSelf: 'center', marginBottom: 12 }}>
                {editInfo.avatar ? (
                  <Image source={{ uri: editInfo.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="person" size={48} color="#bbb" />
                  </View>
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Họ"
                value={editInfo.firstName}
                onChangeText={text => setEditInfo({ ...editInfo, firstName: text })}
                placeholderTextColor="#aaa"
              />
              <TextInput
                style={styles.input}
                placeholder="Tên"
                value={editInfo.lastName}
                onChangeText={text => setEditInfo({ ...editInfo, lastName: text })}
                placeholderTextColor="#aaa"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={editInfo.email}
                onChangeText={text => setEditInfo({ ...editInfo, email: text })}
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                maxLength={255} // Xóa dòng này nếu có, hoặc tăng lên nếu muốn, hoặc bỏ hoàn toàn để không giới hạn
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                value={editInfo.phone}
                onChangeText={text => setEditInfo({ ...editInfo, phone: text })}
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveText}>Lưu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal đổi mật khẩu */}
        <Modal visible={showChangePwd} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu hiện tại"
                value={currentPwd}
                onChangeText={setCurrentPwd}
                secureTextEntry
                placeholderTextColor="#aaa"
              />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu mới"
                value={newPwd}
                onChangeText={setNewPwd}
                secureTextEntry
                placeholderTextColor="#aaa"
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry
                placeholderTextColor="#aaa"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleChangePwd}>
                  <Text style={styles.saveText}>Lưu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowChangePwd(false)}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5f2',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  headerBg: {
    width: '100%',
    backgroundColor: '#ce7e63',
    alignItems: 'center',
    paddingVertical: 14, // Giảm từ 24 xuống 14
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoImg: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  logoImgLarge: {
    width: 110,
    height: 110,
    marginBottom: 8,
  },
  avatarContainer: {
    marginTop: -50,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    borderWidth: 3,
    borderColor: '#fff',
  },
  gearIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ce7e63',
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ce7e63',
    marginBottom: 12,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  infoCard: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#ce7e63',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#ce7e63',
    width: 90,
  },
  infoValue: {
    flex: 1,
    color: '#333',
    fontSize: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#ce7e63',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  changePwdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ce7e63',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ce7e63',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#faf8f6',
    color: '#333',
  },
  saveBtn: {
    backgroundColor: '#ce7e63',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelBtn: {
    backgroundColor: '#aaa',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  addressListModern: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#ce7e63',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  addressListTitle: {
    fontWeight: '700',
    color: '#ce7e63',
    fontSize: 16,
    marginBottom: 8,
    marginLeft: 2,
  },
  addressItemModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#faf8f6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  addressText: {
    flex: 1,
    color: '#333',
    fontSize: 15,
  },
  iconBtn: {
    marginLeft: 6,
    padding: 2,
  },
  addAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 2,
    backgroundColor: '#fcfaf8',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  addCircleBtn: {
    borderWidth: 1.5,
    borderColor: '#ce7e63',
    borderRadius: 20,
    padding: 2,
    marginHorizontal: 6,
    backgroundColor: '#fff',
  },
  addAddressInput: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: '#ce7e63',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#888',
    backgroundColor: '#fff',
    textAlign: 'center',
    marginHorizontal: 4,
  },
  addAddressRowCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
    marginBottom: 2,
    backgroundColor: '#fcfaf8',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    width: '90%',
    alignSelf: 'flex-start',
  },
  addAddressInputCustom: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: '#ce7e63',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#888',
    backgroundColor: '#fff',
    textAlign: 'left',
    marginHorizontal: 4,
    minWidth: 120,
    maxWidth: 180,
  },
  addAddressInputModern: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: '#ce7e63',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#888',
    backgroundColor: '#fff',
    textAlign: 'left',
    marginHorizontal: 4,
    minWidth: 80,
    maxWidth: 180,
  },
  addAddressInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginTop: 4,
  },
  addAddressInputInline: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: '#ce7e63',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#888',
    backgroundColor: '#fff',
    textAlign: 'left',
    marginRight: 8,
  },
});