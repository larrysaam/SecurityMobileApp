import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import ClientBottomNavbar from '../../components/ClientBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const ClientReportsScreen = ({ navigation, route }) => {
  const { apiService } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadReports();
  }, [selectedFilter, selectedType]);

  const loadReports = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') params.append('status', selectedFilter);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (route.params?.siteId) params.append('siteId', route.params.siteId);
      
      const response = await apiService.request(`/client/reports?${params.toString()}`);
      
      if (response.success) {
        setReports(response.data.reports || []);
      } else {
        Alert.alert('Error', 'Failed to load reports');
      }
    } catch (error) {
      console.error('Load reports error:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'patrol': return 'walk';
      case 'incident': return 'alert-circle';
      case 'maintenance': return 'construct';
      case 'inspection': return 'search';
      default: return 'document-text';
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case 'patrol': return COLORS.PRIMARY;
      case 'incident': return COLORS.SECONDARY;
      case 'maintenance': return COLORS.WARNING;
      case 'inspection': return COLORS.INFO;
      default: return COLORS.GRAY[500];
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return COLORS.WARNING;
      case 'validated': return COLORS.SUCCESS;
      case 'pending': return COLORS.INFO;
      case 'rejected': return COLORS.SECONDARY;
      default: return COLORS.GRAY[400];
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return COLORS.SECONDARY;
      case 'high': return COLORS.WARNING;
      case 'medium': return COLORS.INFO;
      case 'low': return COLORS.SUCCESS;
      default: return COLORS.GRAY[400];
    }
  };

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderReportCard = (report) => (
    <TouchableOpacity
      key={report.id}
      style={styles.reportCard}
      onPress={() => navigation.navigate('ClientReportDetails', { reportId: report.id })}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <View style={[styles.typeIcon, { backgroundColor: `${getReportTypeColor(report.type)}15` }]}>
            <Ionicons 
              name={getReportTypeIcon(report.type)} 
              size={20} 
              color={getReportTypeColor(report.type)} 
            />
          </View>
          <View style={styles.reportDetails}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportSite}>{report.siteName}</Text>
            <Text style={styles.reportAgent}>By: {report.agentName}</Text>
          </View>
        </View>
        
        <View style={styles.reportMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
            <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(report.priority) }]}>
            <Text style={styles.priorityText}>{report.priority.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.reportDescription} numberOfLines={2}>
        {report.description}
      </Text>

      <View style={styles.reportFooter}>
        <View style={styles.reportTime}>
          <Ionicons name="time" size={14} color={COLORS.GRAY[500]} />
          <Text style={styles.timeText}>
            {new Date(report.createdAt).toLocaleDateString()} at{' '}
            {new Date(report.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        {report.photos && report.photos.length > 0 && (
          <View style={styles.photoIndicator}>
            <Ionicons name="camera" size={14} color={COLORS.GRAY[500]} />
            <Text style={styles.photoCount}>{report.photos.length}</Text>
          </View>
        )}
      </View>

      {report.clientApproval === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.SUCCESS }]}
            onPress={() => handleApproveReport(report.id, 'approved')}
          >
            <Ionicons name="checkmark" size={16} color={COLORS.WHITE} />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.WARNING }]}
            onPress={() => handleApproveReport(report.id, 'needs_revision')}
          >
            <Ionicons name="create" size={16} color={COLORS.WHITE} />
            <Text style={styles.actionButtonText}>Request Changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const handleApproveReport = (reportId, action) => {
    Alert.alert(
      'Report Action',
      `Are you sure you want to ${action === 'approved' ? 'approve' : 'request changes for'} this report?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const response = await apiService.request(`/client/reports/${reportId}/approve`, {
                method: 'PUT',
                body: JSON.stringify({ action, comments: '' }),
              });

              if (response.success) {
                Alert.alert('Success', `Report ${action} successfully`);
                loadReports();
              } else {
                Alert.alert('Error', 'Failed to update report');
              }
            } catch (error) {
              console.error('Approve report error:', error);
              Alert.alert('Error', 'Failed to update report');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading reports...</Text>
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
        <Text style={styles.headerTitle}>Security Reports</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.GRAY[500]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'submitted', 'validated', 'pending'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive
              ]}>
                {filter === 'all' ? 'All Status' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'patrol', 'incident', 'maintenance', 'inspection'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                selectedType === type && styles.filterButtonActive
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[
                styles.filterText,
                selectedType === type && styles.filterTextActive
              ]}>
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reports List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsHeader}>
          <Text style={styles.statsText}>
            Showing {filteredReports.length} of {reports.length} reports
          </Text>
        </View>

        {filteredReports.length > 0 ? (
          filteredReports.map(renderReportCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.GRAY[400]} />
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No reports available for the selected filters'}
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ClientBottomNavbar />
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
  refreshButton: {
    padding: 8,
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
    color: COLORS.DARK,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[200],
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.WHITE,
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
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  reportSite: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 2,
  },
  reportAgent: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  reportMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  reportDescription: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    lineHeight: 20,
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  reportTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: COLORS.GRAY[500],
    marginLeft: 4,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCount: {
    fontSize: 12,
    color: COLORS.GRAY[500],
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.BORDER_RADIUS,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
});

export default ClientReportsScreen;
