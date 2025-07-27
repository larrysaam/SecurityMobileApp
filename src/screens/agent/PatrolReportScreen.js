import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../../constants';
import apiService from '../../services/apiService';

const PatrolReportScreen = ({ route, navigation }) => {
  const { scheduleId, siteId } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    type: 'patrol',
    priority: 'normal',
    location: null,
    images: [],
    timestamp: new Date().toISOString(),
  });

  const reportTypes = [
    { id: 'patrol', label: 'Routine Patrol', icon: 'walk' },
    { id: 'incident', label: 'Incident Report', icon: 'warning' },
    { id: 'maintenance', label: 'Maintenance Issue', icon: 'construct' },
    { id: 'security', label: 'Security Concern', icon: 'shield' },
  ];

  const priorityLevels = [
    { id: 'low', label: 'Low', color: COLORS.SUCCESS },
    { id: 'normal', label: 'Normal', color: COLORS.WARNING },
    { id: 'high', label: 'High', color: COLORS.SECONDARY },
    { id: 'critical', label: 'Critical', color: COLORS.DANGER || COLORS.SECONDARY },
  ];

  useEffect(() => {
    getCurrentLocation();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library access are required to attach images to reports.'
      );
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setReportData(prev => ({
          ...prev,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          },
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Photo Library', onPress: () => openImageLibrary() },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addImageToReport(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addImageToReport(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', 'Failed to open photo library');
    }
  };

  const addImageToReport = (imageAsset) => {
    const newImage = {
      id: Date.now().toString(),
      uri: imageAsset.uri,
      type: imageAsset.type || 'image/jpeg',
      name: `report_image_${Date.now()}.jpg`,
    };

    setReportData(prev => ({
      ...prev,
      images: [...prev.images, newImage],
    }));
  };

  const removeImage = (imageId) => {
    setReportData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId),
    }));
  };

  const validateReport = () => {
    if (!reportData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a report title');
      return false;
    }
    
    if (!reportData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a report description');
      return false;
    }

    return true;
  };

  const submitReport = async () => {
    if (!validateReport()) return;

    try {
      setLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', reportData.title);
      formData.append('description', reportData.description);
      formData.append('type', reportData.type);
      formData.append('priority', reportData.priority);
      formData.append('scheduleId', scheduleId);
      formData.append('siteId', siteId);
      formData.append('timestamp', reportData.timestamp);
      
      if (reportData.location) {
        formData.append('location', JSON.stringify(reportData.location));
      }

      // Add images to form data
      reportData.images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type,
          name: image.name,
        });
      });

      const response = await apiService.request('/agent/reports', {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Report submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
                // Call refresh callback if provided
                if (route.params?.onSuccess) {
                  route.params.onSuccess();
                }
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priorityId) => {
    const priority = priorityLevels.find(p => p.id === priorityId);
    return priority ? priority.color : COLORS.GRAY[400];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Report</Text>
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Report Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Type</Text>
          <View style={styles.typeGrid}>
            {reportTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  reportData.type === type.id && styles.typeCardSelected,
                ]}
                onPress={() => handleInputChange('type', type.id)}
              >
                <Ionicons
                  name={type.icon}
                  size={24}
                  color={reportData.type === type.id ? COLORS.WHITE : COLORS.PRIMARY}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    reportData.type === type.id && styles.typeLabelSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Level</Text>
          <View style={styles.priorityRow}>
            {priorityLevels.map((priority) => (
              <TouchableOpacity
                key={priority.id}
                style={[
                  styles.priorityButton,
                  { borderColor: priority.color },
                  reportData.priority === priority.id && { backgroundColor: priority.color },
                ]}
                onPress={() => handleInputChange('priority', priority.id)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    { color: reportData.priority === priority.id ? COLORS.WHITE : priority.color },
                  ]}
                >
                  {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Report Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Title</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter a brief title for your report"
            value={reportData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            maxLength={100}
          />
        </View>

        {/* Report Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Provide detailed information about the incident or observation"
            value={reportData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Photo Attachments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photo Evidence</Text>
            <TouchableOpacity style={styles.addPhotoButton} onPress={handleImagePicker}>
              <Ionicons name="camera" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>

          {reportData.images.length > 0 && (
            <View style={styles.imageGrid}>
              {reportData.images.map((image) => (
                <View key={image.id} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(image.id)}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.SECONDARY} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Location Information */}
        {reportData.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationCard}>
              <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  Lat: {reportData.location.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Lng: {reportData.location.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Accuracy: ±{Math.round(reportData.location.accuracy)}m
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.GRAY[400],
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.GRAY[800],
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
  },
  typeCardSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.GRAY[700],
    marginTop: 8,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: COLORS.WHITE,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.WHITE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  addPhotoText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: 6,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 12,
  },
  locationInfo: {
    marginLeft: 12,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginBottom: 2,
  },
});

export default PatrolReportScreen;
