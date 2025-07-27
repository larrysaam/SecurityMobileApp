import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import AgentBottomNavbar from '../../components/AgentBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const AgentReportsScreen = ({ navigation }) => {
  const { apiService } = useAuth();
  const [activeTab, setActiveTab] = useState('my-reports');
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
    loadTemplates();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await apiService.getReports();

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
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await apiService.getReportTemplates();

      if (response.success) {
        setTemplates(response.data || []);
      }
    } catch (error) {
      console.error('Load templates error:', error);
    }
  };

  const handleCreateReport = async (templateId) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Navigate to create report screen with template
      // For now, show alert
      Alert.alert(
        'Create Report',
        `Creating ${template.name}...`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create',
            onPress: async () => {
              const reportData = {
                title: `${template.name} - ${new Date().toLocaleDateString()}`,
                type: template.type,
                content: `Report created from ${template.name} template`,
              };

              const response = await apiService.createReport(reportData);
              if (response.success) {
                Alert.alert('Success', 'Report created successfully');
                loadReports(); // Refresh reports list
              } else {
                Alert.alert('Error', 'Failed to create report');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Create report error:', error);
      Alert.alert('Error', 'Failed to create report');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return COLORS.SUCCESS;
      case 'draft': return COLORS.WARNING;
      case 'pending': return COLORS.INFO;
      default: return COLORS.GRAY[500];
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'patrol': return 'walk';
      case 'incident': return 'alert-circle';
      case 'maintenance': return 'construct';
      default: return 'document-text';
    }
  };

  const renderReportCard = (report) => {
    const createdDate = new Date(report.createdAt);
    const formattedDate = createdDate.toLocaleDateString();
    const formattedTime = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity key={report.id} style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportIcon}>
            <Ionicons
              name={getTypeIcon(report.type)}
              size={20}
              color={COLORS.PRIMARY}
            />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportSite}>{report.siteName || 'No site specified'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
            <Text style={styles.statusText}>{report.status}</Text>
          </View>
        </View>
        <View style={styles.reportFooter}>
          <Text style={styles.reportDate}>
            {formattedDate} at {formattedTime}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.GRAY[400]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setActiveTab('templates')}
        >
          <Ionicons name="add" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-reports' && styles.activeTab]}
          onPress={() => setActiveTab('my-reports')}
        >
          <Text style={[styles.tabText, activeTab === 'my-reports' && styles.activeTabText]}>
            My Reports
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
            Templates
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : activeTab === 'my-reports' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            {reports.length > 0 ? (
              reports.map(renderReportCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color={COLORS.GRAY[400]} />
                <Text style={styles.emptyText}>No reports found</Text>
                <Text style={styles.emptySubtext}>Create your first report using templates</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Templates</Text>

            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => handleCreateReport(template.id)}
              >
                <Ionicons
                  name={getTypeIcon(template.type)}
                  size={24}
                  color={template.type === 'patrol' ? COLORS.PRIMARY :
                         template.type === 'incident' ? COLORS.SECONDARY : COLORS.WARNING}
                />
                <Text style={styles.templateTitle}>{template.name}</Text>
                <Text style={styles.templateDesc}>{template.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <AgentBottomNavbar navigation={navigation} currentRoute="AgentReports" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  headerTitle: {
    fontSize: 20,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
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
  reportCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  reportSite: {
    fontSize: 14,
    color: COLORS.GRAY[600],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textTransform: 'uppercase',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportDate: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  templateCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginTop: 8,
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING * 2,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    marginTop: 12,
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
});

export default AgentReportsScreen;
