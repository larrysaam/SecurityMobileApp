import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

const AgentBottomNavbar = ({ navigation, currentRoute = 'Dashboard' }) => {
  const [showClockInOptions, setShowClockInOptions] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'grid-outline',
      activeIcon: 'grid',
      route: 'AgentDashboard',
      color: COLORS.PRIMARY,
    },
    {
      id: 'clockin',
      label: 'Clock In/Out',
      icon: 'time-outline',
      activeIcon: 'time',
      action: 'clockin',
      color: COLORS.SUCCESS,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'document-text-outline',
      activeIcon: 'document-text',
      route: 'AgentReports',
      color: COLORS.INFO,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: 'alert-circle-outline',
      activeIcon: 'alert-circle',
      route: 'AgentAlerts',
      color: COLORS.SECONDARY,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: 'chatbubble-outline',
      activeIcon: 'chatbubble',
      route: 'AgentChat',
      color: COLORS.WARNING,
    },
  ];

  const handleNavPress = (item) => {
    if (item.action === 'clockin') {
      setShowClockInOptions(true);
    } else if (item.route) {
      navigation.navigate(item.route);
    }
  };

  const handleClockInOption = (type) => {
    setShowClockInOptions(false);
    
    if (type === 'gps') {
      navigation.navigate('ClockInGPS');
    } else if (type === 'qr') {
      navigation.navigate('ClockInQR');
    }
  };

  const isActive = (itemId) => {
    const routeMap = {
      'dashboard': ['AgentDashboard', 'Dashboard'],
      'clockin': ['ClockInGPS', 'ClockInQR'],
      'reports': ['AgentReports', 'Reports', 'CreateReport'],
      'alerts': ['AgentAlerts', 'Alerts', 'CreateAlert'],
      'chat': ['AgentChat', 'Chat'],
    };

    return routeMap[itemId]?.includes(currentRoute) || false;
  };

  const ClockInModal = () => (
    <Modal
      visible={showClockInOptions}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowClockInOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Clock In Method</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowClockInOptions(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.GRAY[600]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.modalOption, { backgroundColor: COLORS.SUCCESS }]}
            onPress={() => handleClockInOption('gps')}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="location" size={28} color={COLORS.WHITE} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.modalOptionText}>GPS Location</Text>
              <Text style={styles.modalOptionDesc}>Use your current location to clock in/out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.WHITE} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalOption, { backgroundColor: COLORS.INFO }]}
            onPress={() => handleClockInOption('qr')}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="qr-code" size={28} color={COLORS.WHITE} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.modalOptionText}>QR Code</Text>
              <Text style={styles.modalOptionDesc}>Scan the site QR code to clock in/out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.WHITE} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalCancel}
            onPress={() => setShowClockInOptions(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.navbar}>
          {navItems.map((item) => {
            const active = isActive(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                onPress={() => handleNavPress(item)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  active && { backgroundColor: `${item.color}15` }
                ]}>
                  <Ionicons
                    name={active ? item.activeIcon : item.icon}
                    size={22}
                    color={active ? item.color : COLORS.GRAY[500]}
                  />
                  {item.id === 'alerts' && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>3</Text>
                    </View>
                  )}
                  {item.id === 'chat' && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>2</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.navLabel,
                  { color: active ? item.color : COLORS.GRAY[500] }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      <ClockInModal />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
    elevation: 8,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navbar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.SECONDARY,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: SIZES.BORDER_RADIUS * 2,
    borderTopRightRadius: SIZES.BORDER_RADIUS * 2,
    padding: SIZES.PADDING * 1.5,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  closeButton: {
    padding: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.PADDING,
    borderRadius: SIZES.BORDER_RADIUS,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  modalOptionDesc: {
    fontSize: 13,
    color: COLORS.WHITE,
    opacity: 0.9,
    lineHeight: 18,
  },
  modalCancel: {
    padding: SIZES.PADDING,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: COLORS.GRAY[100],
    borderRadius: SIZES.BORDER_RADIUS,
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
});

export default AgentBottomNavbar;
