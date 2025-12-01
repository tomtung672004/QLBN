// QLBN/MainTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProductManagement from './ProductManagement';
import CustomerManagement from './CustomerManagement';
import OrderManagement from './OrderManagement';
import ReportStatistics from './ReportStatistics';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="ProductManagement"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'ProductManagement':
              iconName = 'cube-outline';
              break;
            case 'CustomerManagement':
              iconName = 'people-outline';
              break;
            case 'OrderManagement':
              iconName = 'receipt-outline';
              break;
            case 'ReportStatistics':
              iconName = 'bar-chart-outline';
              break;
            default:
              iconName = 'apps-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ce7e63',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarStyle: {
          paddingVertical: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="ProductManagement" component={ProductManagement} options={{ title: 'Sản phẩm' }} />
      <Tab.Screen name="CustomerManagement" component={CustomerManagement} options={{ title: 'Khách hàng' }} />
      <Tab.Screen name="OrderManagement" component={OrderManagement} options={{ title: 'Đơn hàng' }} />
      <Tab.Screen name="ReportStatistics" component={ReportStatistics} options={{ title: 'Thống kê' }} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
