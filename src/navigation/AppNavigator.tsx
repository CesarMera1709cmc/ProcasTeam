import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import UserInputScreen from '../screens/UserInputScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import TeamScreen from '../screens/TeamScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PublicCommitmentsScreen from '../screens/PublicCommitmentsScreen';
import AppBlockerScreen from '../screens/AppBlockerScreen';
import DailyChallengeScreen from '../screens/DailyChallengeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { RootStackParamList } from '../types/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home" id={undefined}
        screenOptions={{ 
          headerShown: false,
          // Estas opciones evitan las recargas innecesarias
          animationTypeForReplace: 'push',
          animation: 'simple_push',
        }}
      >
        {/* Pantallas de onboarding */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="UserInput" component={UserInputScreen} />
        
        {/* Pantallas principales - se comportan como tabs */}
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ 
            gestureEnabled: false, // Evita gestos de retroceso accidentales
          }}
        />
        <Stack.Screen 
          name="PublicCommitments" 
          component={PublicCommitmentsScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen 
          name="AppBlocker" 
          component={AppBlockerScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen 
          name="DailyChallenge" 
          component={DailyChallengeScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ gestureEnabled: false }}
        />
        
        {/* Pantallas modales/secundarias */}
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