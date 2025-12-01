// QLBN/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthManagement from './screens/others/AuthManagement';
import MainTabNavigator from './screens/admins/MainTabNavigator';
import CustomerTabNavigator from './screens/customers/CustomerTabNavigator';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthManagement" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthManagement" component={AuthManagement} />
        <Stack.Screen name="MainTabNavigator" component={MainTabNavigator} />
        <Stack.Screen name="CustomerTabNavigator" component={CustomerTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
