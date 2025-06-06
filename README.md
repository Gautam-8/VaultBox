# VaultBox - Secure Digital Vault with Emergency Access

VaultBox is a modern, secure digital vault application that allows users to safely store sensitive information while providing a robust emergency access system for trusted contacts.

## 🔒 Core Features & Workflow

### 1. Vault Management
- **Creating Entries**
  - Add sensitive information with end-to-end encryption
  - Attach files (up to 50KB)
  - Categorize entries (Finance, Health, Personal, Notes)
  - Set visibility and access controls
  - Add descriptions and metadata

- **Managing Entries**
  - Update or delete entries
  - Monitor access logs in real-time
  - Set expiration dates
  - Instant sync across devices

### 2. Emergency Access System
- **Setting Up Trusted Contacts**
  - Add registered users as trusted contacts
  - Configure inactivity threshold (e.g., 30 days)
  - Select entries to share during emergency
  - Set up notification preferences
  - Real-time contact status monitoring

- **Access Request Flow**
  1. Trusted contact initiates access request
  2. System checks owner's inactivity period instantly
  3. If threshold met, access granted automatically
  4. If not met, request remains pending
  5. Owner can manually grant access anytime
  6. Real-time status updates for all parties

- **Access Management**
  - View active access grants with live status
  - Monitor access requests in real-time
  - Revoke access with immediate effect
  - Live activity tracking

### 3. Notification System
- **Types of Notifications**
  - Instant emergency access requests alerts
  - Real-time access grant notifications
  - Immediate trusted contact updates
  - Proactive inactivity warnings
  - Entry expiration alerts

- **Delivery Channels**
  - Instant in-app notifications
  - Real-time email alerts
  - Live updates dashboard
  - Push notifications
  - Activity feed with live updates

### 4. Security Measures
- **Data Protection**
  - End-to-end encryption
  - Secure file storage
  - Real-time access logging

## 🛠 Technical Implementation

### Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Components**: 
  - Tailwind CSS for styling
  - Radix UI for accessible components
  - Framer Motion for animations
- **State Management**: 
  - TanStack Query for automatic data synchronization
  - Background data refetching
  - Optimistic updates
- **Data Validation**: Zod schema validation

### Backend Architecture
- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: 
  - JWT with refresh tokens
- **Services**:
  - REST API endpoints for real-time data
  - Scheduled tasks for automated checks
  - Email notifications via Mailjet

### Real-time Features Implementation
- Automatic data polling with TanStack Query
- Optimistic UI updates for instant feedback
- Background data synchronization
- Scheduled server-side checks
- Email notifications for critical events
- Instant UI state updates


