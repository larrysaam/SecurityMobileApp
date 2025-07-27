# Development Guide - BahinLink

## Next Development Steps

### 1. Installing Missing Dependencies

You will need to install the following packages for the application to work:

```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs @react-navigation/drawer

# Expo dependencies for navigation
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated

# Geolocation and notifications
npx expo install expo-location expo-notifications expo-device

# Local storage
npm install @react-native-async-storage/async-storage

# Icons
npx expo install @expo/vector-icons

# Utilities
npm install react-native-gesture-handler react-native-reanimated
```

### 2. Expo Configuration

Update your `app.json`:

```json
{
  "expo": {
    "name": "BahinLink",
    "slug": "bahinlink",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1E3A8A"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app uses location for on-site check-in.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "This app uses location for agent tracking."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1E3A8A"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "This app uses location for check-in and agent tracking."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#1E3A8A"
        }
      ]
    ]
  }
}
```

### 3. Development by Modules

#### A. Start with Authentication

1. **Create backend API** (Node.js/Express or Laravel)
2. **Implement auth endpoints**:
   - POST /api/auth/login
   - POST /api/auth/register
   - POST /api/auth/refresh
   - POST /api/auth/logout

3. **Test authentication** with mocked data

#### B. Develop Agent Module

1. **Priority screens**:
   - AgentDashboardScreen ✅ (created)
   - CheckInScreen
   - CheckOutScreen
   - CreateReportScreen
   

2. **Services to implement**:
   - Functional geolocation
   - Zone validation
   - Photo upload

3. **Key Tasks:**
  - View assigned shifts and schedules
  - Clock in/out via GPS location or QR code
  - Submit patrol reports with photo evidence
  - Report incidents with supporting documentation
  - Receive alerts and notifications
  - Communicate with supervisors

#### C. Supervisor Module

1. **Key screens**:
   - SupervisorDashboardScreen
   - AgentTrackingScreen
   - ReportValidationScreen

#### D. Admin Module

1. **Management screens**:
   - AdminDashboardScreen
   - UserManagementScreen
   - ScheduleManagementScreen

### 4. Structure de Base de Données

#### Tables Principales

```sql
-- Utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    phone VARCHAR,
    role ENUM('admin', 'supervisor', 'agent', 'client'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Sites
CREATE TABLE sites (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    geofence_radius INTEGER DEFAULT 100,
    qr_code VARCHAR,
    client_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
);

-- Plannings
CREATE TABLE schedules (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES users(id),
    site_id UUID REFERENCES sites(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
    notes TEXT,
    created_at TIMESTAMP
);

-- Pointages
CREATE TABLE check_ins (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES users(id),
    site_id UUID REFERENCES sites(id),
    type ENUM('check_in', 'check_out'),
    timestamp TIMESTAMP NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    method ENUM('gps', 'qr', 'manual'),
    photo_url VARCHAR,
    notes TEXT,
    created_at TIMESTAMP
);

-- Rapports
CREATE TABLE reports (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES users(id),
    site_id UUID REFERENCES sites(id),
    type ENUM('daily', 'incident', 'maintenance', 'inspection'),
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    status ENUM('draft', 'submitted', 'validated', 'rejected'),
    priority ENUM('low', 'medium', 'high', 'urgent'),
    photos JSON,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP,
    client_signature TEXT,
    created_at TIMESTAMP
);

-- Alertes
CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES users(id),
    site_id UUID REFERENCES sites(id),
    type ENUM('emergency', 'incident', 'maintenance', 'info'),
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent'),
    status ENUM('open', 'in_progress', 'resolved', 'closed'),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP
);
```

### 5. Configuration des Services

#### A. Service de Géolocalisation

```javascript
// Dans src/services/location.js
// Ajoutez votre clé API Google Maps si nécessaire
const GOOGLE_MAPS_API_KEY = 'your-api-key-here';
```

#### B. Service de Notifications

```javascript
// Dans src/services/notification.js
// Configurez votre projet Expo pour les notifications push
const EXPO_PROJECT_ID = 'your-expo-project-id';
```

### 6. Tests et Validation

#### A. Tests Unitaires

```bash
# Installer Jest et les utilitaires de test
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

#### B. Tests d'Intégration

1. **Tester l'authentification**
2. **Tester la géolocalisation**
3. **Tester les notifications**
4. **Tester le mode hors ligne**

### 7. Déploiement

#### A. Configuration de Production

1. **Variables d'environnement** :
   ```javascript
   // src/constants/index.js
   export const API_ENDPOINTS = {
     BASE_URL: __DEV__ 
       ? 'http://localhost:3000/api' 
       : 'https://api.bahinlink.com',
   };
   ```

2. **Build de production** :
   ```bash
   expo build:android --type=apk
   expo build:ios --type=archive
   ```

#### B. Distribution

1. **Google Play Store** (Android)
2. **Apple App Store** (iOS)
3. **Distribution interne** (Expo)

### 8. Monitoring et Maintenance

#### A. Analytics

```bash
# Installer Expo Analytics
npx expo install expo-analytics-amplitude
```

#### B. Crash Reporting

```bash
# Installer Sentry
npm install @sentry/react-native
```

### 9. Fonctionnalités Avancées

#### A. Mode Hors Ligne

1. **Implémenter Redux Persist** ou **AsyncStorage**
2. **Queue de synchronisation**
3. **Détection de connectivité**

#### B. Notifications Push

1. **Configuration Firebase** (Android)
2. **Configuration APNs** (iOS)
3. **Serveur de notifications**

### 10. Sécurité

#### A. Chiffrement

1. **Chiffrement des données sensibles**
2. **Certificat SSL/TLS**
3. **Validation côté serveur**

#### B. Authentification

1. **JWT avec refresh tokens**
2. **Biométrie** (optionnel)
3. **2FA** (optionnel)

## Ressources Utiles

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

## Support Technique

Pour toute question technique :
1. Consultez la documentation officielle
2. Vérifiez les issues GitHub
3. Contactez l'équipe de développement
