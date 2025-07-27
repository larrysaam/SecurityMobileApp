import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import AdminBottomNavbar from '../../components/AdminBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const AdminSystemScreen = ({ navigation }) => {
  const { apiService } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempSettings, setTempSettings] = useState({});

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/admin/system/settings');
      
      if (response.success) {
        setSettings(response.data);
        setTempSettings(response.data);
      } else {
        Alert.alert('Error', 'Failed to load system settings');
      }
    } catch (error) {
      console.error('Load settings error:', error);
      Alert.alert('Error', 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await apiService.request('/admin/system/settings', {
        method: 'PUT',
        body: JSON.stringify(tempSettings),
      });

      if (response.success) {
        setSettings(tempSettings);
        setShowSettingsModal(false);
        Alert.alert('Success', 'Settings updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleBackup = () => {
    Alert.alert(
      'Create Backup',
      'Are you sure you want to create a system backup?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              const response = await apiService.request('/admin/system/backup', {
                method: 'POST',
              });

              if (response.success) {
                Alert.alert('Success', 'System backup created successfully');
              } else {
                Alert.alert('Error', 'Failed to create backup');
              }
            } catch (error) {
              console.error('Backup error:', error);
              Alert.alert('Error', 'Failed to create backup');
            }
          },
        },
      ]
    );
  };

  const systemActions = [
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: 'settings',
      color: COLORS.PRIMARY,
      onPress: () => setShowSettingsModal(true),
    },
    {
      id: 'backup',
      title: 'Create Backup',
      description: 'Backup system data',
      icon: 'cloud-download',
      color: COLORS.INFO,
      onPress: handleBackup,
    },
    {
      id: 'logs',
      title: 'System Logs',
      description: 'View system activity logs',
      icon: 'document-text',
      color: COLORS.WARNING,
      onPress: () => Alert.alert('System Logs', 'System logs feature coming soon'),
    },
    {
      id: 'health',
      title: 'System Health',
      description: 'Check system status',
      icon: 'pulse',
      color: COLORS.SUCCESS,
      onPress: () => Alert.alert('System Health', 'System health monitoring coming soon'),
    },
    {
      id: 'users-export',
      title: 'Export Users',
      description: 'Export user data to CSV',
      icon: 'people',
      color: COLORS.SECONDARY,
      onPress: () => Alert.alert('Export Users', 'User export feature coming soon'),
    },
    {
      id: 'reports-export',
      title: 'Export Reports',
      description: 'Export reports to PDF',
      icon: 'document',
      color: COLORS.INFO,
      onPress: () => Alert.alert('Export Reports', 'Report export feature coming soon'),
    },
  ];

  const renderActionCard = (action) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionCard}
      onPress={action.onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
        <Ionicons name={action.icon} size={24} color={action.color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionDescription}>{action.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.GRAY[400]} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading system settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Management</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* System Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.overviewCard}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Company</Text>
              <Text style={styles.overviewValue}>{settings?.companyName || 'BAHIN SARL'}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Timezone</Text>
              <Text style={styles.overviewValue}>{settings?.timezone || 'Europe/Paris'}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Version</Text>
              <Text style={styles.overviewValue}>1.0.0</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: COLORS.SUCCESS }]} />
                <Text style={[styles.overviewValue, { color: COLORS.SUCCESS }]}>Online</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Enable Notifications</Text>
                <Text style={styles.settingDescription}>System-wide notifications</Text>
              </View>
              <Switch
                value={settings?.enableNotifications || false}
                onValueChange={(value) => {
                  const newSettings = { ...settings, enableNotifications: value };
                  setSettings(newSettings);
                  // Auto-save quick settings
                  apiService.request('/admin/system/settings', {
                    method: 'PUT',
                    body: JSON.stringify(newSettings),
                  });
                }}
                trackColor={{ false: COLORS.GRAY[300], true: COLORS.PRIMARY }}
                thumbColor={COLORS.WHITE}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Enable Tracking</Text>
                <Text style={styles.settingDescription}>Agent location tracking</Text>
              </View>
              <Switch
                value={settings?.enableTracking || false}
                onValueChange={(value) => {
                  const newSettings = { ...settings, enableTracking: value };
                  setSettings(newSettings);
                  // Auto-save quick settings
                  apiService.request('/admin/system/settings', {
                    method: 'PUT',
                    body: JSON.stringify(newSettings),
                  });
                }}
                trackColor={{ false: COLORS.GRAY[300], true: COLORS.PRIMARY }}
                thumbColor={COLORS.WHITE}
              />
            </View>
          </View>
        </View>

        {/* System Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Actions</Text>
          <View style={styles.actionsContainer}>
            {systemActions.map(renderActionCard)}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setTempSettings(settings);
                setShowSettingsModal(false);
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.DARK} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>System Settings</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveSettings}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Company Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter company name"
                value={tempSettings.companyName || ''}
                onChangeText={(text) => setTempSettings({ ...tempSettings, companyName: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Timezone</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter timezone"
                value={tempSettings.timezone || ''}
                onChangeText={(text) => setTempSettings({ ...tempSettings, timezone: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location Update Interval (minutes)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="5"
                value={String(tempSettings.locationUpdateInterval || '')}
                onChangeText={(text) => setTempSettings({ ...tempSettings, locationUpdateInterval: parseInt(text) || 5 })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Default Geofence Radius (meters)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="100"
                value={String(tempSettings.geofenceRadius || '')}
                onChangeText={(text) => setTempSettings({ ...tempSettings, geofenceRadius: parseInt(text) || 100 })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Max Login Attempts</Text>
              <TextInput
                style={styles.formInput}
                placeholder="3"
                value={String(tempSettings.maxLoginAttempts || '')}
                onChangeText={(text) => setTempSettings({ ...tempSettings, maxLoginAttempts: parseInt(text) || 3 })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Session Timeout (hours)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="24"
                value={String(tempSettings.sessionTimeout || '')}
                onChangeText={(text) => setTempSettings({ ...tempSettings, sessionTimeout: parseInt(text) || 24 })}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <AdminBottomNavbar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[100],
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SIZES.PADDING,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  overviewLabel: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  overviewValue: {
    fontSize: 14,
    color: COLORS.DARK,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  settingsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  actionsContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  bottomPadding: {
    height: 100,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
    paddingTop: 50,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  modalSaveButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  modalSaveText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
    borderRadius: SIZES.BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.DARK,
  },
});

export default AdminSystemScreen;
