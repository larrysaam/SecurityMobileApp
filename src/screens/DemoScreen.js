import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

const DemoScreen = ({ navigation, route }) => {
  const { userRole = 'guest' } = route.params || {};

  const demoRoutes = {
    admin: [
      { name: 'User Management', icon: 'people', screen: 'UserManagement' },
      { name: 'Statistics', icon: 'analytics', screen: 'Statistics' },
      { name: 'Schedule Management', icon: 'calendar', screen: 'ScheduleManagement' },
    ],
    supervisor: [
      { name: 'Agent Tracking', icon: 'location', screen: 'AgentTracking' },
      { name: 'Report Validation', icon: 'checkmark-circle', screen: 'ReportValidation' },
      { name: 'Site Management', icon: 'business', screen: 'SiteManagement' },
    ],
    agent: [
      { name: 'Check In/Out', icon: 'location', screen: 'CheckInOut' },
      { name: 'Create Report', icon: 'document-text', screen: 'CreateReport' },
      { name: 'View Schedule', icon: 'calendar', screen: 'Schedule' },
      { name: 'Alerts', icon: 'alert-circle', screen: 'Alerts' },
    ],
    client: [
      { name: 'Site Status', icon: 'business', screen: 'SiteStatus' },
      { name: 'View Reports', icon: 'document-text', screen: 'Reports' },
      { name: 'Service Requests', icon: 'help-circle', screen: 'ServiceRequests' },
    ],
  };

  const routes = demoRoutes[userRole] || [];

  const handleNavigation = (screenName) => {
    // For demo purposes, just show an alert
    alert(`Navigating to ${screenName}\n\nThis is a demo - the screen would open here.`);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return COLORS.SECONDARY;
      case 'supervisor': return COLORS.WARNING;
      case 'agent': return COLORS.SUCCESS;
      case 'client': return COLORS.INFO;
      default: return COLORS.GRAY[500];
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return 'shield-checkmark';
      case 'supervisor': return 'eye';
      case 'agent': return 'person';
      case 'client': return 'business';
      default: return 'person-circle';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getRoleColor(userRole) }]}>
        <Ionicons name={getRoleIcon(userRole)} size={48} color={COLORS.WHITE} />
        <Text style={styles.headerTitle}>
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
        </Text>
        <Text style={styles.headerSubtitle}>BahinLink Security Management</Text>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Welcome to the {userRole} interface!
        </Text>
        <Text style={styles.descriptionText}>
          This is a demo of the BahinLink security management system. 
          Below are the main features available for your role.
        </Text>
      </View>

      {/* Navigation Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Features</Text>
        {routes.map((route, index) => (
          <TouchableOpacity
            key={index}
            style={styles.routeButton}
            onPress={() => handleNavigation(route.screen)}
          >
            <View style={styles.routeIcon}>
              <Ionicons name={route.icon} size={24} color={getRoleColor(userRole)} />
            </View>
            <Text style={styles.routeText}>{route.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.GRAY[400]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Demo Info */}
      <View style={styles.demoInfo}>
        <Text style={styles.demoTitle}>🚀 Demo Information</Text>
        <Text style={styles.demoText}>
          • This is a working demo of the BahinLink app
        </Text>
        <Text style={styles.demoText}>
          • Auto-refresh is enabled - try editing the code!
        </Text>
        <Text style={styles.demoText}>
          • All navigation routes are set up and ready
        </Text>
        <Text style={styles.demoText}>
          • Mock data and services are implemented
        </Text>
      </View>

      {/* Login Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Try Different Roles</Text>
        <Text style={styles.loginInfo}>
          Use these credentials to test different user roles:
        </Text>
        
        <View style={styles.credentialCard}>
          <Text style={styles.credentialTitle}>Admin Access</Text>
          <Text style={styles.credentialText}>Email: admin@bahin.com</Text>
          <Text style={styles.credentialText}>Password: password123</Text>
        </View>

        <View style={styles.credentialCard}>
          <Text style={styles.credentialTitle}>Supervisor Access</Text>
          <Text style={styles.credentialText}>Email: supervisor@bahin.com</Text>
          <Text style={styles.credentialText}>Password: password123</Text>
        </View>

        <View style={styles.credentialCard}>
          <Text style={styles.credentialTitle}>Agent Access</Text>
          <Text style={styles.credentialText}>Email: agent@bahin.com</Text>
          <Text style={styles.credentialText}>Password: password123</Text>
        </View>

        <View style={styles.credentialCard}>
          <Text style={styles.credentialTitle}>Client Access</Text>
          <Text style={styles.credentialText}>Email: client@bahin.com</Text>
          <Text style={styles.credentialText}>Password: password123</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[100],
  },
  header: {
    alignItems: 'center',
    padding: SIZES.PADDING * 2,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.WHITE,
    opacity: 0.9,
    marginTop: 4,
  },
  welcomeSection: {
    backgroundColor: COLORS.WHITE,
    margin: SIZES.MARGIN,
    padding: SIZES.PADDING,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    lineHeight: 20,
  },
  section: {
    margin: SIZES.MARGIN,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 12,
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: SIZES.PADDING,
    borderRadius: SIZES.BORDER_RADIUS,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.DARK,
    fontWeight: '500',
  },
  demoInfo: {
    backgroundColor: COLORS.INFO,
    margin: SIZES.MARGIN,
    padding: SIZES.PADDING,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 8,
  },
  demoText: {
    fontSize: 14,
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  loginInfo: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 12,
  },
  credentialCard: {
    backgroundColor: COLORS.WHITE,
    padding: 12,
    borderRadius: SIZES.BORDER_RADIUS,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  credentialTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  credentialText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    fontFamily: 'monospace',
  },
});

export default DemoScreen;
