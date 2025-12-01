import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from './HomeScreen';
import CartScreen from './CartScreen';
import OrdersScreen from './OrdersScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

const CustomerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Trang chủ':
              iconName = 'home-outline';
              break;
            case 'Giỏ hàng':
              iconName = 'cart-outline';
              break;
            case 'Đơn hàng':
              iconName = 'document-text-outline';
              break;
            case 'Tài khoản':
              iconName = 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ce7e63',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Trang chủ" component={HomeScreen} />
      <Tab.Screen name="Giỏ hàng" component={CartScreen} />
      <Tab.Screen name="Đơn hàng" component={OrdersScreen} />
      <Tab.Screen name="Tài khoản" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default CustomerTabNavigator;
