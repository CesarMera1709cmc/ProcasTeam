import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import UserInputScreen from './src/screens/UserInputScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TeamScreen from './src/screens/TeamScreen';
import CreateGoalScreen from './src/screens/CreateGoalScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" id={undefined}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Inicio', headerShown: false }}
        />
        <Stack.Screen
          name="UserInput"
          component={UserInputScreen}
          options={{ title: 'Tu nombre', headerShown: false }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Dashboard', headerShown: false }}
        />
        <Stack.Screen
          name="Team"
          component={TeamScreen}
          options={{ title: 'Equipo', headerShown: false }}
        />
        <Stack.Screen
          name="CreateGoal"
          component={CreateGoalScreen}
          options={{ title: 'Nueva Meta', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}