import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants';

const AdminBottomNavbar = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const navItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: 'grid-outline',
      activeIcon: 'grid',
      screen: 'AdminDashboardMain',
      badge: null,
    },
    {
      id: 'users',
      name: 'Users',
      icon: 'people-outline',
      activeIcon: 'people',
      screen: 'AdminUsers',
      badge: null,
    },
    {
      id: 'sites',
      name: 'Sites',
      icon: 'location-outline',
      activeIcon: 'location',
      screen: 'AdminSites',
      badge: null,
    },
    {
      id: 'tracking',
      name: 'Tracking',
      icon: 'map-outline',
      activeIcon: 'map',
      screen: 'AdminTracking',
      badge: null,
    },
    {
      id: 'system',
      name: 'System',
      icon: 'settings-outline',
      activeIcon: 'settings',
      screen: 'AdminSystem',
      badge: null,
    },
  ];

  const getCurrentTab = () => {
    const currentRouteName = route.name;
    const currentTab = navItems.find(item => item.screen === currentRouteName);
    return currentTab ? currentTab.id : 'dashboard';
  };

  const handleNavigation = (screen) => {
    if (route.name !== screen) {
      navigation.navigate(screen);
    }
  };

  const renderNavItem = (item) => {
    const isActive = getCurrentTab() === item.id;
    const iconName = isActive ? item.activeIcon : item.icon;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.navItem}
        onPress={() => handleNavigation(item.screen)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={iconName}
            size={24}
            color={isActive ? COLORS.PRIMARY : COLORS.GRAY[500]}
          />
          {item.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.navText,
            { color: isActive ? COLORS.PRIMARY : COLORS.GRAY[500] },
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        {navItems.map(renderNavItem)}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
    elevation: 8,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: COLORS.WHITE,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.SECONDARY,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  navText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default AdminBottomNavbar;
