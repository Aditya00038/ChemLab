# ChemStock - Chemical Laboratory Inventory Management

A modern Next.js application for managing chemical and equipment inventory in laboratories, with real-time search powered by PubChem API.

## Features

- 🔐 **Firebase Authentication** - Email/Password and Google Sign-in with role-based access
- 🔒 **Access Control** - Admin and regular user roles with permission management
- 🧪 **Chemical Viewer** - Search chemicals using PubChem API with detailed information
- 📦 **Chemical Inventory** - Track chemical quantities with low-stock alerts and usage tracking
- 🔧 **Equipment Management** - Check-out/return system with availability tracking
- 🛒 **Reorder Cart** - Automatic low-stock detection and manual chemical ordering
- 📊 **Reports & Analytics** - Generate usage reports, inventory reports, and audit logs
- 💾 **Database Backup** - Full database backup and restore functionality (admin only)
- 📈 **Activity Logs** - Comprehensive audit trail of all inventory actions
- ⚡ **Edit Mode Protection** - Admin-only edit controls for inventory management
- 📥 **CSV Export** - Download chemicals, equipment, and reports as CSV files
- 🌙 **Dark Mode** - Theme toggle support with system preference detection
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- 🔍 **Advanced Search** - Filter and sort inventory with real-time search
- 🚨 **Stock Alerts** - Automatic notifications for low and out-of-stock items

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase setup instructions.

Quick steps:
1. Create Firebase project
2. Enable Email/Password and Google authentication
3. Add authorized users in Firebase Console
4. Copy Firebase config to `.env.local`

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Firebase config and authorized emails.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002)

## Authentication

- Only users listed in `NEXT_PUBLIC_ALLOWED_EMAILS` can access the app
- Users can login with Email/Password or Google
- Unauthorized users are automatically logged out

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── activity/        # Usage logs and activity tracking
│   │   ├── admin/           # Admin panel (reports, backup, settings)
│   │   ├── cart/            # Chemical reorder management
│   │   ├── chemical-viewer/ # PubChem chemical search
│   │   ├── chemicals/       # Chemical inventory management
│   │   ├── dashboard/       # Main dashboard overview
│   │   ├── equipment/       # Equipment checkout system
│   │   ├── init-db/         # Database initialization
│   │   ├── reports/         # Reporting and analytics
│   │   ├── settings/        # User settings
│   │   └── support/         # Support and help
│   ├── home/                # Landing page
│   └── layout.tsx           # Root layout with providers
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── [other components]   # Custom reusable components
├── contexts/
│   ├── AuthContext.tsx      # Authentication state management
│   └── FirestoreContext.tsx # Firestore data management
├── lib/
│   ├── firebase.ts          # Firebase configuration
│   ├── backup.ts            # Database backup utilities
│   ├── reports.ts           # Report generation utilities
│   ├── auditLog.ts          # Audit logging
│   ├── data.ts              # Data utilities
│   └── [other utilities]    # Helper functions
└── hooks/                   # Custom React hooks
```

## Tech Stack

- **Next.js 15.5.7** - React framework with App Router
- **Firebase** - Authentication and Firestore database
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful accessible UI components
- **PubChem API** - Chemical data integration
- **TypeScript** - Type-safe development
- **PWA** - Progressive Web App support for offline access

## Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md) - Detailed Firebase configuration
- [Role Permissions](./docs/ROLESINFO.md) - Complete role-based feature access guide
- [Features Status](./FEATURES_STATUS.txt) - Current implementation status
- [Production Readiness](./PRODUCTION_READINESS.md) - Deployment checklist

## License

MIT
