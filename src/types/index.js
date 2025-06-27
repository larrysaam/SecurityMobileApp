// User Types
export const UserType = {
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: '',
  avatar: '',
  isActive: false,
  createdAt: '',
  updatedAt: ''
};

export const AgentType = {
  ...UserType,
  employeeId: '',
  skills: [],
  certifications: [],
  currentSite: null,
  isOnDuty: false,
  lastLocation: null
};

// Location Types
export const LocationType = {
  latitude: 0,
  longitude: 0,
  accuracy: 0,
  timestamp: '',
  address: ''
};

// Site Types
export const SiteType = {
  id: '',
  name: '',
  address: '',
  location: LocationType,
  clientId: '',
  isActive: true,
  qrCode: '',
  geofenceRadius: 100, // meters
  requiredSkills: [],
  description: ''
};

// Schedule Types
export const ScheduleType = {
  id: '',
  agentId: '',
  siteId: '',
  startTime: '',
  endTime: '',
  date: '',
  status: '',
  notes: ''
};

// Check-in/Check-out Types
export const CheckInType = {
  id: '',
  agentId: '',
  siteId: '',
  timestamp: '',
  location: LocationType,
  method: '', // 'gps', 'qr', 'manual'
  photo: '',
  notes: ''
};

export const CheckOutType = {
  ...CheckInType,
  duration: 0, // minutes
  reportId: ''
};

// Report Types
export const ReportType = {
  id: '',
  agentId: '',
  siteId: '',
  type: '',
  title: '',
  description: '',
  status: '',
  priority: '',
  photos: [],
  timestamp: '',
  validatedBy: '',
  validatedAt: '',
  clientSignature: ''
};

// Alert Types
export const AlertType = {
  id: '',
  agentId: '',
  siteId: '',
  type: '',
  title: '',
  description: '',
  priority: '',
  status: '',
  location: LocationType,
  timestamp: '',
  resolvedBy: '',
  resolvedAt: ''
};

// Message Types
export const MessageType = {
  id: '',
  senderId: '',
  receiverId: '',
  content: '',
  type: '', // 'text', 'image', 'file'
  timestamp: '',
  isRead: false,
  attachments: []
};

// Notification Types
export const NotificationType = {
  id: '',
  userId: '',
  title: '',
  body: '',
  type: '',
  data: {},
  isRead: false,
  timestamp: ''
};

// Statistics Types
export const StatisticsType = {
  totalAgents: 0,
  activeAgents: 0,
  totalSites: 0,
  activeSites: 0,
  totalReports: 0,
  pendingReports: 0,
  totalAlerts: 0,
  resolvedAlerts: 0,
  attendanceRate: 0,
  responseTime: 0
};

// Client Types
export const ClientType = {
  id: '',
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  sites: [],
  isActive: true,
  contractStartDate: '',
  contractEndDate: ''
};
