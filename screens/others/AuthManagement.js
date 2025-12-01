import React, { useEffect,useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  Image, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { serverurl } from '../../server/Config'; 
const AuthManagement = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role,SetRole]=useState('');

  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${serverurl}/login`, {
        username,
        password
      });
  
      if (response.status === 200 && response.data.success) {
        const user = response.data.user;
        if (user.locked) {
          Alert.alert('Tài khoản bị khóa', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
          return;
        }
        const role = user.role;
        await AsyncStorage.setItem('CurrentUsername', username);
        Alert.alert('Đăng nhập thành công', `Chào mừng, ${username}`);
  
        if (role === 'admin') {
          navigation.replace('MainTabNavigator', { username: username });
        } else {
          navigation.replace('CustomerTabNavigator', { username: username });
        }
      } else {
        Alert.alert('Lỗi', response.data.message || 'Sai tài khoản hoặc mật khẩu');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng nhập');
    }
  };
  

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !username || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
  
    try {
      const response = await axios.post(`${serverurl}/register`, {
        firstName,
        lastName,
        email,
        username,
        password,
        role: 'customer', // hoặc 'admin' nếu bạn muốn test tài khoản quản trị viên
      });
  
      if (response.status === 201 && response.data.success) {
        Alert.alert('Đăng ký thành công', `Chào mừng ${firstName}!`);
  
        // Reset form
        setFirstName('');
        setLastName('');
        setEmail('');
        setUsername('');
        setPassword('');
        SetRole('');
        setIsLogin(true); // Trở lại trạng thái đăng nhập
      } else {
        Alert.alert('Lỗi', response.data.message || 'Đã có lỗi xảy ra khi đăng ký');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng ký');
    }
  };
  

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require('../../assets/logo.png')} // Đường dẫn đến logo của bạn
          style={styles.logo}
        />
        <Text style={styles.title}>{isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}</Text>
        <Text style={styles.switchText}>
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <Text style={styles.switchLink} onPress={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Đăng ký tại đây' : 'Đăng nhập tại đây'}
          </Text>
        </Text>

        <View style={styles.inputContainer}>
          {!isLogin && (
           <>
              <TextInput
                placeholder="Họ"
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
              />
              <TextInput
                placeholder="Tên"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
              />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </>
          )}

          <TextInput
            placeholder="Tên đăng nhập"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
          <TextInput
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={isLogin ? handleLogin : handleRegister}
          >
            <Text style={styles.buttonText}>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthManagement;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
  },
  switchText: {
    fontSize: 14,
    marginBottom: 25,
    color: '#555',
  },
  switchLink: {
    color: '#ce7e63',
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#ce7e63',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});