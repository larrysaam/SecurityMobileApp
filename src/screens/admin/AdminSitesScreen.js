import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import AdminBottomNavbar from '../../components/AdminBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const AdminSitesScreen = ({ navigation, route }) => {
  const { apiService } = useAuth();
  const [sites, setSites] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSite, setNewSite] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    geofenceRadius: '100',
    clientId: '',
  });

  useEffect(() => {
    loadSites();
    loadClients();
    
    // Check if we should show create modal from navigation params
    if (route.params?.action === 'create') {
      setShowCreateModal(true);
    }
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/admin/sites');
      
      if (response.success) {
        setSites(response.data.sites || []);
      } else {
        Alert.alert('Error', 'Failed to load sites');
      }
    } catch (error) {
      console.error('Load sites error:', error);
      Alert.alert('Error', 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await apiService.request('/admin/users?role=client');
      
      if (response.success) {
        setClients(response.data.users || []);
      }
    } catch (error) {
      console.error('Load clients error:', error);
    }
  };

  const handleCreateSite = async () => {
    try {
      if (!newSite.name || !newSite.address || !newSite.latitude || !newSite.longitude || !newSite.clientId) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const response = await apiService.request('/admin/sites', {
        method: 'POST',
        body: JSON.stringify(newSite),
      });

      if (response.success) {
        Alert.alert('Success', 'Site created successfully');
        setShowCreateModal(false);
        setNewSite({
          name: '',
          address: '',
          latitude: '',
          longitude: '',
          geofenceRadius: '100',
          clientId: '',
        });
        loadSites();
      } else {
        Alert.alert('Error', response.message || 'Failed to create site');
      }
    } catch (error) {
      console.error('Create site error:', error);
      Alert.alert('Error', 'Failed to create site');
    }
  };

  const handleGenerateQRCode = async (siteId, siteName) => {
    try {
      const response = await apiService.request(`/admin/sites/${siteId}/qr-code`, {
        method: 'POST',
      });

      if (response.success) {
        Alert.alert('Success', `QR code generated for ${siteName}`);
        loadSites();
      } else {
        Alert.alert('Error', 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Generate QR code error:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };

  const handleDeleteSite = (siteId, siteName) => {
    Alert.alert(
      'Delete Site',
      `Are you sure you want to delete ${siteName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.request(`/admin/sites/${siteId}`, {
                method: 'DELETE',
              });

              if (response.success) {
                Alert.alert('Success', 'Site deleted successfully');
                loadSites();
              } else {
                Alert.alert('Error', 'Failed to delete site');
              }
            } catch (error) {
              console.error('Delete site error:', error);
              Alert.alert('Error', 'Failed to delete site');
            }
          },
        },
      ]
    );
  };

  const filteredSites = sites.filter(site =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (site.clientName && site.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderSiteCard = (site) => (
    <View key={site.id} style={styles.siteCard}>
      <View style={styles.siteHeader}>
        <View style={styles.siteInfo}>
          <View style={styles.siteIcon}>
            <Ionicons name="location" size={24} color={COLORS.PRIMARY} />
          </View>
          <View style={styles.siteDetails}>
            <Text style={styles.siteName}>{site.name}</Text>
            <Text style={styles.siteAddress}>{site.address}</Text>
            <Text style={styles.clientName}>Client: {site.clientName || 'Unknown'}</Text>
          </View>
        </View>
        <View style={styles.siteActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.INFO }]}
            onPress={() => handleGenerateQRCode(site.id, site.name)}
          >
            <Ionicons name="qr-code" size={16} color={COLORS.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.SECONDARY }]}
            onPress={() => handleDeleteSite(site.id, site.name)}
          >
            <Ionicons name="trash" size={16} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.siteMetrics}>
        <View style={styles.metric}>
          <Ionicons name="navigate" size={16} color={COLORS.GRAY[500]} />
          <Text style={styles.metricText}>
            {site.latitude ? Number(site.latitude).toFixed(4) : '0.0000'}, {site.longitude ? Number(site.longitude).toFixed(4) : '0.0000'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="radio-button-on" size={16} color={COLORS.GRAY[500]} />
          <Text style={styles.metricText}>{site.geofenceRadius}m radius</Text>
        </View>
      </View>

      {site.qrCode && (
        <View style={styles.qrCodeSection}>
          <Text style={styles.qrCodeLabel}>QR Code:</Text>
          <Text style={styles.qrCodeValue}>{site.qrCode}</Text>
        </View>
      )}

      <View style={styles.siteFooter}>
        <View style={[styles.statusBadge, { 
          backgroundColor: site.isActive ? COLORS.SUCCESS : COLORS.GRAY[400] 
        }]}>
          <Text style={styles.statusText}>
            {site.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
        <Text style={styles.createdDate}>
          Created: {new Date(site.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading sites...</Text>
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
        <Text style={styles.headerTitle}>Site Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.GRAY[500]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sites..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Sites List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsText}>
            Showing {filteredSites.length} of {sites.length} sites
          </Text>
        </View>

        {filteredSites.length > 0 ? (
          filteredSites.map(renderSiteCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color={COLORS.GRAY[400]} />
            <Text style={styles.emptyText}>No sites found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search criteria' : 'Create your first site'}
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Create Site Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.DARK} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Site</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleCreateSite}
            >
              <Text style={styles.modalSaveText}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Site Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter site name"
                value={newSite.name}
                onChangeText={(text) => setNewSite({ ...newSite, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address *</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Enter full address"
                value={newSite.address}
                onChangeText={(text) => setNewSite({ ...newSite, address: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Latitude *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.000000"
                  value={newSite.latitude}
                  onChangeText={(text) => setNewSite({ ...newSite, latitude: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Longitude *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.000000"
                  value={newSite.longitude}
                  onChangeText={(text) => setNewSite({ ...newSite, longitude: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Geofence Radius (meters)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="100"
                value={newSite.geofenceRadius}
                onChangeText={(text) => setNewSite({ ...newSite, geofenceRadius: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Client *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.clientSelector}>
                  {clients.map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={[
                        styles.clientOption,
                        newSite.clientId === client.id && styles.clientOptionActive
                      ]}
                      onPress={() => setNewSite({ ...newSite, clientId: client.id })}
                    >
                      <Ionicons
                        name="business"
                        size={16}
                        color={newSite.clientId === client.id ? COLORS.WHITE : COLORS.SUCCESS}
                      />
                      <Text style={[
                        styles.clientOptionText,
                        newSite.clientId === client.id && styles.clientOptionTextActive
                      ]}>
                        {client.firstName} {client.lastName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
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
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    backgroundColor: COLORS.WHITE,
    padding: SIZES.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY[100],
    borderRadius: SIZES.BORDER_RADIUS,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
    color: COLORS.DARK,
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  statsHeader: {
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  siteCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  siteInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  siteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siteDetails: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  siteAddress: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
  clientName: {
    fontSize: 12,
    color: COLORS.SUCCESS,
    fontWeight: '500',
  },
  siteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  siteMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginLeft: 4,
  },
  qrCodeSection: {
    backgroundColor: COLORS.GRAY[100],
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 12,
    marginBottom: 12,
  },
  qrCodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
  qrCodeValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: COLORS.DARK,
  },
  siteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  createdDate: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SIZES.PADDING * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.GRAY[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.GRAY[500],
    textAlign: 'center',
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
  formRow: {
    flexDirection: 'row',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  clientSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  clientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
    backgroundColor: COLORS.WHITE,
  },
  clientOptionActive: {
    backgroundColor: COLORS.SUCCESS,
    borderColor: COLORS.SUCCESS,
  },
  clientOptionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: COLORS.DARK,
  },
  clientOptionTextActive: {
    color: COLORS.WHITE,
  },
});

export default AdminSitesScreen;
