import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { ApiService } from '../../services/apiService';

const ReportsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'patrol', 'incident', 'pending', 'submitted'

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    try {
      setLoading(true);

      const response = await ApiService.getAgentReports({ filter });
      if (response.success) {
        const processedReports = response.data.reports.map(report => ({
          ...report,
          formattedDate: formatDate(report.createdAt),
          formattedTime: formatTime(report.createdAt),
        }));

        setReports(processedReports);
      } else {
        console.error('Failed to load reports:', response.message);
        Alert.alert('Error', 'Failed to load reports');
      }
    } catch (error) {
      console.error('Reports loading error:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }, [filter]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'patrol': return 'walk';
      case 'incident': return 'alert-circle';
      case 'maintenance': return 'construct';
      case 'security': return 'shield';
      default: return 'document-text';
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case 'patrol': return COLORS.INFO;
      case 'incident': return COLORS.ERROR;
      case 'maintenance': return COLORS.WARNING;
      case 'security': return COLORS.PRIMARY;
      default: return COLORS.GRAY[500];
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return COLORS.SUCCESS;
      case 'pending': return COLORS.WARNING;
      case 'draft': return COLORS.GRAY[500];
      case 'validated': return COLORS.PRIMARY;
      default: return COLORS.GRAY[400];
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'submitted': return 'SUBMITTED';
      case 'pending': return 'PENDING';
      case 'draft': return 'DRAFT';
      case 'validated': return 'VALIDATED';
      default: return 'UNKNOWN';
    }
  };

  const handleCreateReport = () => {
    Alert.alert(
      'Create Report',
      'What type of report would you like to create?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Patrol Report',
          onPress: () => navigation.navigate('PatrolReport', {
            onSuccess: loadReports
          })
        },
        {
          text: 'Incident Report',
          onPress: () => navigation.navigate('IncidentAlert', {
            onSuccess: loadReports
          })
        },
      ]
    );
  };

  const handleReportPress = (report) => {
    navigation.navigate('ReportDetails', {
      reportId: report.id,
      report: report,
      onUpdate: loadReports
    });
  };

  const filterButtons = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'patrol', label: 'Patrol', icon: 'walk' },
    { key: 'incident', label: 'Incident', icon: 'alert-circle' },
    { key: 'pending', label: 'Pending', icon: 'time' },
    { key: 'submitted', label: 'Submitted', icon: 'checkmark-circle' },
  ];

  const renderReportItem = ({ item: report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => handleReportPress(report)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportTypeSection}>
          <View style={[
            styles.reportTypeIcon,
            { backgroundColor: getReportTypeColor(report.type) }
          ]}>
            <Ionicons
              name={getReportTypeIcon(report.type)}
              size={20}
              color={COLORS.WHITE}
            />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportType}>{report.type.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(report.status) }
        ]}>
          <Text style={styles.statusText}>{getStatusText(report.status)}</Text>
        </View>
      </View>

      <Text style={styles.reportDescription} numberOfLines={2}>
        {report.description || 'No description provided'}
      </Text>

      <View style={styles.reportFooter}>
        <View style={styles.dateTimeInfo}>
          <Ionicons name="calendar" size={14} color={COLORS.GRAY[500]} />
          <Text style={styles.dateText}>{report.formattedDate}</Text>
          <Ionicons name="time" size={14} color={COLORS.GRAY[500]} />
          <Text style={styles.timeText}>{report.formattedTime}</Text>
        </View>

        {report.photos && report.photos.length > 0 && (
          <View style={styles.attachmentInfo}>
            <Ionicons name="camera" size={14} color={COLORS.GRAY[500]} />
            <Text style={styles.attachmentText}>{report.photos.length}</Text>
          </View>
        )}
      </View>

      {report.site && (
        <View style={styles.siteInfo}>
          <Ionicons name="location" size={14} color={COLORS.GRAY[500]} />
          <Text style={styles.siteText}>{report.site.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
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
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateReport}
        >
          <Ionicons name="add" size={20} color={COLORS.WHITE} />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterButtons.map((button) => (
          <TouchableOpacity
            key={button.key}
            style={[
              styles.filterButton,
              filter === button.key && styles.activeFilterButton
            ]}
            onPress={() => setFilter(button.key)}
          >
            <Ionicons
              name={button.icon}
              size={16}
              color={filter === button.key ? COLORS.WHITE : COLORS.PRIMARY}
            />
            <Text style={[
              styles.filterButtonText,
              filter === button.key && styles.activeFilterButtonText
            ]}>
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reports List */}
      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.GRAY[400]} />
          <Text style={styles.emptyStateTitle}>No Reports Found</Text>
          <Text style={styles.emptyStateText}>
            {filter === 'all'
              ? "You haven't created any reports yet"
              : `No ${filter} reports found`}
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={handleCreateReport}
          >
            <Text style={styles.emptyStateButtonText}>Create Your First Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.reportsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.GRAY[600],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  filterContainer: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.PRIMARY,
  },
  activeFilterButtonText: {
    color: COLORS.WHITE,
  },
  reportsList: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  reportTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  reportType: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.GRAY[600],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  dateTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attachmentText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  siteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  siteText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.GRAY[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.GRAY[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});

export default ReportsScreen;
