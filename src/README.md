# BahinLink - Project Structure

## Application Architecture

This application follows a modular architecture with clear separation of responsibilities.

### Folder Structure

```
src/
├── components/          # Reusable components
├── screens/            # Application screens
├── navigation/         # Navigation configuration
├── services/           # API services and business logic
├── store/             # State management (Redux/Context)
├── utils/             # Utilities and helpers
├── constants/         # Application constants
├── hooks/             # Custom hooks
├── types/             # TypeScript types
└── assets/            # Images, icons, etc.
```

### Main Modules

1. **Authentication** - Secure login management
2. **Dashboard** - Role-based dashboards
3. **Scheduling** - Schedule and assignment management
4. **Tracking** - GPS tracking and check-in/out
5. **Reports** - Reports and documentation
6. **Messaging** - Internal communication
7. **Alerts** - Alert and notification system
8. **Client** - Client interface (optional)

### User Roles

- **Administrator** - Complete system management
- **Supervisor** - Oversight and validation
- **Agent** - Field personnel
- **Client** - Limited access to information
