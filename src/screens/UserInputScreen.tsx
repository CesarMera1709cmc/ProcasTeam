import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/types';
import { UserService, StoredUser } from '../services/UserService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserInputScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserInput'>;
type UserInputScreenRouteProp = RouteProp<RootStackParamList, 'UserInput'>;

interface UserInputScreenProps {
  navigation: UserInputScreenNavigationProp;
  route: UserInputScreenRouteProp;
}

const UserInputScreen: React.FC<UserInputScreenProps> = ({ navigation, route }) => {
  const { userType, existingUsers } = route.params;
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (userName.trim() === '') {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }

    // Check if user already exists (case-insensitive)
    const normalizedUserName = userName.trim().toLowerCase();
    if (existingUsers && existingUsers.includes(normalizedUserName)) {
      Alert.alert(
        'Usuario Existente', 
        `Ya existe un usuario con el nombre "${userName.trim()}". Por favor elige un nombre diferente o selecciona el usuario existente desde la pantalla anterior.`,
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      // Generar un ID único basado en el tipo de usuario, nombre y timestamp
      const userId = `${userType}-${userName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      
      // Crear el objeto de usuario para almacenar
      const newUser: StoredUser = {
        id: userId,
        name: userName.trim(),
        userType,
        points: 0,
        streak: 0,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      // Guardar el usuario en Firebase
      await UserService.addUser(newUser);

      // Guardar el ID del nuevo usuario en AsyncStorage para la sesión actual
      await AsyncStorage.setItem('currentUserId', userId);

      // Navegar al Dashboard
      navigation.replace('Dashboard', { 
        userId, 
        userName: userName.trim() 
      });
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', 'Hubo un problema al guardar tu información');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>¡Perfecto!</Text>
          <Text style={styles.subtitle}>
            Vamos a crear tu cuenta
          </Text>
          <Text style={styles.description}>
            ¿Cómo te llamas?
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Tu nombre</Text>
          <TextInput
            style={styles.textInput}
            value={userName}
            onChangeText={setUserName}
            placeholder="Escribe tu nombre aquí"
            placeholderTextColor="#A0AEC0"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={30}
            editable={!isLoading}
            autoFocus={true}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (userName.trim() === '' || isLoading) && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={userName.trim() === '' || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.continueButtonText,
                userName.trim() === '' && styles.continueButtonTextDisabled
              ]}>
                Crear Cuenta
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#4299E1',
    marginBottom: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 48,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F7FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  continueButton: {
    backgroundColor: '#2D3748',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: '#E2E8F0',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  backButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserInputScreen;