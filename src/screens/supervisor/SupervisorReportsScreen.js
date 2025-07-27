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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import SupervisorBottomNavbar from '../../components/SupervisorBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const SupervisorReportsScreen = ({ navigation, route }) => {
  const { apiService } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [validationComments, setValidationComments] = useState('');

  useEffect(() => {
    loadReports();
  }, [selectedFilter, selectedType]);

  const loadReports = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') params.append('status', selectedFilter);
      if (selectedType !== 'all') params.append('type', selectedType);
      
      const response = await apiService.request(`/supervisor/reports?${params.toString()}`);
      
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

  const handleValidateReport = (report, action) => {
    setSelectedReport(report);
    setValidationComments('');
    setShowValidationModal(true);
  };

  const submitValidation = async (action) => {
    try {
      const response = await apiService.request(`/supervisor/reports/${selectedReport.id}/validate`, {
        method: 'PUT',
        body: JSON.stringify({ 
          action, 
          comments: validationComments 
        }),
      });

      if (response.success) {
        Alert.alert('Success', `Report ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        setShowValidationModal(false);
        setSelectedReport(null);
        setValidationComments('');
        loadReports();
      } else {
        Alert.alert('Error', 'Failed to validate report');
      }
    } catch (error) {
      console.error('Validate report error:', error);
      Alert.alert('Error', 'Failed to validate report');
    }
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
    report.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.siteName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderReportCard = (report) => (
    <TouchableOpacity
      key={report.id}
      style={styles.reportCard}
      onPress={() => navigation.navigate('SupervisorReportDetails', { reportId: report.id })}
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
            <Text style={styles.reportAgent}>By: {report.agentName}</Text>
            <Text style={styles.reportSite}>Site: {report.siteName}</Text>
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

      {report.status === 'submitted' && (
        <View style={styles.validationButtons}>
          <TouchableOpacity
            style={[styles.validationButton, { backgroundColor: COLORS.SUCCESS }]}
            onPress={() => handleValidateReport(report, 'approve')}
          >
            <Ionicons name="checkmark" size={16} color={COLORS.WHITE} />
            <Text style={styles.validationButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.validationButton, { backgroundColor: COLORS.SECONDARY }]}
            onPress={() => handleValidateReport(report, 'reject')}
          >
            <Ionicons name="close" size={16} color={COLORS.WHITE} />
            <Text style={styles.validationButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {report.validatedBy && (
        <View style={styles.validationInfo}>
          <Text style={styles.validationText}>
            {report.status === 'validated' ? 'Approved' : 'Rejected'} on{' '}
            {new Date(report.validatedAt).toLocaleDateString()}
          </Text>
          {report.validationComments && (
            <Text style={styles.validationComments}>
              Comments: {report.validationComments}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Report Validation</Text>
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
          {['all', 'submitted', 'validated', 'rejected'].map((filter) => (
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
          <Text style={styles.pendingText}>
            {reports.filter(r => r.status === 'submitted').length} pending validation
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

      {/* Validation Modal */}
      <Modal
        visible={showValidationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowValidationModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.DARK} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Validate Report</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedReport && (
              <>
                <View style={styles.reportSummary}>
                  <Text style={styles.summaryTitle}>{selectedReport.title}</Text>
                  <Text style={styles.summaryAgent}>By: {selectedReport.agentName}</Text>
                  <Text style={styles.summaryDescription}>{selectedReport.description}</Text>
                </View>

                <View style={styles.commentsSection}>
                  <Text style={styles.commentsLabel}>Validation Comments (Optional)</Text>
                  <TextInput
                    style={styles.commentsInput}
                    placeholder="Add comments about this report..."
                    value={validationComments}
                    onChangeText={setValidationComments}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: COLORS.SUCCESS }]}
                    onPress={() => submitValidation('approve')}
                  >
                    <Ionicons name="checkmark" size={20} color={COLORS.WHITE} />
                    <Text style={styles.modalActionText}>Approve Report</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: COLORS.SECONDARY }]}
                    onPress={() => submitValidation('reject')}
                  >
                    <Ionicons name="close" size={20} color={COLORS.WHITE} />
                    <Text style={styles.modalActionText}>Reject Report</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      <SupervisorBottomNavbar />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  pendingText: {
    fontSize: 14,
    color: COLORS.WARNING,
    fontWeight: '600',
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
  reportAgent: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginBottom: 2,
  },
  reportSite: {
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
    marginBottom: 12,
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
  validationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  validationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.BORDER_RADIUS,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  validationButtonText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  validationInfo: {
    backgroundColor: COLORS.GRAY[100],
    padding: 8,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  validationText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginBottom: 2,
  },
  validationComments: {
    fontSize: 12,
    color: COLORS.GRAY[700],
    fontStyle: 'italic',
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
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  reportSummary: {
    backgroundColor: COLORS.GRAY[100],
    padding: 16,
    borderRadius: SIZES.BORDER_RADIUS,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 8,
  },
  summaryAgent: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 8,
  },
  summaryDescription: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    lineHeight: 20,
  },
  commentsSection: {
    marginBottom: 30,
  },
  commentsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 8,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
    borderRadius: SIZES.BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.DARK,
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    gap: 12,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  modalActionText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SupervisorReportsScreen;
