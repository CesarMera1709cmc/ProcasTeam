import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

interface BottomNavigationProps {
  navigation: any;
  currentScreen: string;
  userId?: string;
  userName?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  navigation, 
  currentScreen, 
  userId, 
  userName 
}) => {
  const navItems = [
    { 
      icon: "home", 
      label: "Inicio", 
      screen: "Dashboard",
      isActive: currentScreen === 'Dashboard' 
    },
    { 
      icon: "target", 
      label: "Compromisos", 
      screen: "PublicCommitments",
      isActive: currentScreen === 'PublicCommitments' 
    },
    { 
      icon: "shield", 
      label: "Bloquear", 
      screen: "AppBlocker",
      isActive: currentScreen === 'AppBlocker' 
    },
    { 
      icon: "star", 
      label: "Reto", 
      screen: "DailyChallenge",
      isActive: currentScreen === 'DailyChallenge' 
    },
    { 
      icon: "user", 
      label: "Perfil", 
      screen: "Profile",
      isActive: currentScreen === 'Profile' 
    },
  ];

  const handleNavigation = (screen: string) => {
    const params: any = {};
    
    if (userId) {
      params.userId = userId;
    }
    
    if (userName) {
      params.userName = userName;
    }

    if (screen === 'Team') {
      params.currentUserId = userId;
      navigation.navigate('Team', params); // Modal, usar navigate
    } else if (screen === 'CreateGoal') {
      navigation.navigate('CreateGoal', params); // Modal, usar navigate
    } else {
      // Para pantallas principales, usar replace para evitar stack acumulado
      navigation.replace(screen, params);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {navItems.map(({ icon, label, screen, isActive }) => (
          <TouchableOpacity
            key={screen}
            onPress={() => handleNavigation(screen)}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <Feather 
              name={icon as any}
              size={20} 
              color={isActive ? '#2D3748' : '#A0AEC0'} 
            />
            <Text style={[
              styles.navLabel,
              { color: isActive ? '#2D3748' : '#A0AEC0' }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default BottomNavigation;