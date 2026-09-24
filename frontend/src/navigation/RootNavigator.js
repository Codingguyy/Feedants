import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../styles/theme';

import HomeScreen from '../screens/HomeScreen';
import CompetitionDetailsScreen from '../screens/CompetitionDetailsScreen';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.textPrimary }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Feedants' }} />
        <Stack.Screen
          name="CompetitionDetails"
          component={CompetitionDetailsScreen}
          options={{ title: '', headerTransparent: true, headerTintColor: '#fff' }}
        />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log In' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
