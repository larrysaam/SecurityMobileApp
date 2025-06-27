# BahinLink - Project Structure

## Overview

BahinLink is a React Native mobile application developed with Expo for BAHIN SARL's private security management. The application enables real-time personnel tracking, schedule management, reports, and internal communications.

## Architecture

The application follows a modular architecture with clear separation of responsibilities:

```
BahinLink/
├── src/
│   ├── components/         # Reusable components
│   ├── screens/           # Application screens
│   ├── navigation/        # Navigation configuration
│   ├── services/          # API services and business logic
│   ├── store/            # State management (Context API)
│   ├── utils/            # Utilities and helpers
│   ├── constants/        # Application constants
│   ├── hooks/            # Custom hooks
│   ├── types/            # Types and interfaces
│   └── assets/           # Images, icons, etc.
├── assets/               # Expo assets
├── package.json
└── App.js               # Main entry point
```

## Main Modules

### 1. Authentication (`src/screens/auth/`)
- **LoginScreen** - Secure login
- **RegisterScreen** - Registration (admin validation required)
- **ForgotPasswordScreen** - Password reset

### 2. Navigation (`src/navigation/`)
- **AppNavigator** - Main role-based navigation
- **AuthNavigator** - Authentication navigation
- **AgentNavigator** - Navigation for agents
- **SupervisorNavigator** - Navigation for supervisors
- **AdminNavigator** - Navigation for administrators
- **ClientNavigator** - Navigation for clients

### 3. User Roles

#### Security Agent
- Geolocated check-in/check-out
- Patrol report creation
- SOS/Anomaly alert button
- Personal schedule consultation
- Messaging with supervisors

#### Supervisor
- Real-time agent tracking
- Report validation
- Inspection report creation
- Incident management
- Communication with agents and clients

#### Administrator
- Complete user management
- Schedule creation and management
- Agent assignment to sites
- Statistics and dashboards
- Application configuration

#### Client (Optional)
- On-site personnel visualization
- Report access
- Service requests
- Incident reporting

### 4. Services (`src/services/`)

#### ApiService
- Gestion des appels API REST
- Authentification JWT
- Gestion des tokens et refresh
- Endpoints pour tous les modules

#### LocationService
- Géolocalisation GPS
- Validation de présence sur site
- Suivi en temps réel
- Calcul de distances et ETA
- Gestion des géofences

#### NotificationService
- Notifications push (Expo)
- Notifications locales
- Gestion des badges
- Catégorisation des alertes

### 5. Gestion d'État (`src/store/`)

#### AuthContext
- État d'authentification
- Informations utilisateur
- Gestion des sessions
- Refresh automatique des tokens

#### AppContext
- État global de l'application
- Données métier (plannings, rapports, alertes)
- Synchronisation hors ligne
- Cache local

### 6. Composants Réutilisables (`src/components/`)

#### Common
- **Button** - Boutons avec variantes
- **Input** - Champs de saisie
- **LoadingSpinner** - Indicateurs de chargement
- **Card** - Cartes d'information
- **Modal** - Modales personnalisées

### 7. Hooks Personnalisés (`src/hooks/`)

#### useLocation
- Gestion de la géolocalisation
- Validation de position
- Suivi en temps réel
- Calculs de distance

#### useNotifications
- Gestion des notifications
- Permissions
- Handlers d'événements

### 8. Utilitaires (`src/utils/`)
- **storage** - Stockage local (AsyncStorage)
- **dateUtils** - Manipulation des dates
- **validation** - Validation des formulaires
- **locationUtils** - Calculs géographiques
- **permissions** - Gestion des permissions utilisateur

## Fonctionnalités Clés

### Pointage Géolocalisé
- Vérification GPS obligatoire
- Scan QR code sur site
- Validation de zone (géofence)
- Historique des pointages

### Rapports et Documentation
- Rapports de ronde
- Rapports d'incident
- Photos et signatures
- Validation hiérarchique

### Système d'Alertes
- Bouton SOS d'urgence
- Alertes d'anomalie
- Notifications push instantanées
- Escalade automatique

### Communication
- Messagerie interne
- Notifications push
- Diffusion de consignes
- Chat temps réel

### Mode Hors Ligne
- Synchronisation automatique
- Cache local des données
- Fonctionnement dégradé
- Reprise de connexion

## Technologies Utilisées

- **React Native** - Framework mobile
- **Expo** - Plateforme de développement
- **React Navigation** - Navigation
- **Expo Location** - Géolocalisation
- **Expo Notifications** - Notifications push
- **AsyncStorage** - Stockage local
- **Context API** - Gestion d'état

## Sécurité

### Authentification
- JWT tokens
- Refresh automatique
- Chiffrement des données sensibles
- Sessions sécurisées

### Permissions
- Contrôle d'accès basé sur les rôles
- Validation côté client et serveur
- Audit trail des actions

### Données
- Chiffrement en transit (HTTPS)
- Stockage sécurisé local
- Conformité RGPD
- Anonymisation des logs

## Installation et Développement

### Prérequis
- Node.js 16+
- Expo CLI
- Android Studio / Xcode (pour émulateurs)

### Installation
```bash
npm install
```

### Développement
```bash
npm start          # Démarrer Expo
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS
npm run web        # Lancer sur Web
```

### Tests
```bash
npm test           # Lancer les tests
npm run test:watch # Tests en mode watch
```

## Déploiement

### Build de Production
```bash
expo build:android  # Build Android
expo build:ios      # Build iOS
```

### Publication
```bash
expo publish       # Publication OTA
```

## Roadmap

### Phase 1 (MVP)
- [x] Structure du projet
- [ ] Authentification
- [ ] Navigation par rôles
- [ ] Pointage géolocalisé
- [ ] Rapports basiques

### Phase 2
- [ ] Notifications push
- [ ] Mode hors ligne
- [ ] Interface client
- [ ] Statistiques avancées

### Phase 3
- [ ] IA pour analyse des données
- [ ] Intégrations tierces
- [ ] Application web admin
- [ ] API publique

## Support

Pour toute question ou problème :
- Email : support@bahin-sarl.com
- Documentation : [docs.bahinlink.com]
- Issues : [GitHub Issues]
