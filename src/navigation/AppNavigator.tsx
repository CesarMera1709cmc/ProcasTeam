import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import UserInputScreen from '../screens/UserInputScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import TeamScreen from '../screens/TeamScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PublicCommitmentsScreen from '../screens/PublicCommitmentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { RootStackParamList, TabParamList } from '../types/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Navegador de tabs principales
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          switch (route.name) {
            case 'DashboardTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'PublicCommitmentsTab':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E5EA',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        headerShown: false,
        lazy: false,
        unmountOnBlur: false,
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen}
        options={{ 
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="PublicCommitmentsTab" 
        component={PublicCommitmentsScreen}
        options={{ 
          tabBarLabel: 'Compromisos',
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ 
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ 
          headerShown: false,
          animationTypeForReplace: 'push',
          animation: 'simple_push',
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="UserInput" 
          component={UserInputScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={MainTabNavigator}
          options={{ 
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="CreateGoal" 
          component={CreateGoalScreen}
          options={{ 
            presentation: 'modal',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="Team" 
          component={TeamScreen}
          options={{ 
            presentation: 'modal',
            gestureEnabled: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;