# Youth Service Philippines - Tagum Chapter Web App

A comprehensive web application for managing attendance, member information, announcements, feedback, events, and more for the Youth Service Philippines - Tagum Chapter.

## 🌟 Features

### Theme System
- **Light/Dark Mode**: Toggle between light and dark themes
- **Persistent Settings**: Theme preference saved in localStorage
- **Smooth Transitions**: 0.3-0.4s transitions for all theme changes

### Authentication & Access Control
- **Role-Based Access**: Different features available based on user role (Admin, Head, Auditor, Member, Guest)
- **Demo Accounts Available**:
  - Admin: `admin` / `admin123`
  - Head: `head` / `head123`
  - Auditor: `auditor` / `auditor123`
  - Member: `member` / `member123`
  - Guest: `guest` / `guest123`

## 📱 Main Features

### 1. Homepage
- Organization information (About, Mission, Vision, Objectives)
- Organizational chart
- Founder information with contact links
- Projects showcase with image gallery
- Click on projects to view full details in modal

### 2. Dashboard & Directory (Admin, Head, Auditor)
- **Officer Directory Search**: Search members by name or ID with autocomplete
- **Attendance Dashboard**: Visual pie charts showing attendance breakdown by event
- **Attendance Analytics**: Detailed committee-wise attendance reports with names

### 3. Attendance Management
- **QR Attendance Scanner** (Admin, Head, Auditor): Scan QR codes for Time In/Out
- **Manual Attendance** (Admin, Head, Auditor): Manually record attendance
- **Manage Events** (Admin, Head, Auditor): Create events, toggle active/inactive status
- **My QR ID** (All Members): Display personal QR code for scanning
- **Attendance Transparency** (All Members): View personal attendance history

### 4. Communication Center
- **Announcements**: 
  - View announcements (filtered by recipient type)
  - Create announcements (Admin, Head, Auditor only)
  - Mark as read functionality
  - Badge indicators for unread announcements
- **Feedback**:
  - Submit feedback with unique reference numbers (YSPTFB-XXXX)
  - View own feedback (Members) or all feedback (Admin, Auditor)
  - Reply to feedback (Admin, Auditor only)
  - Track feedback status

### 5. Logs & Reports (Admin, Auditor)
- **Access Logs**: View all login activity with timestamps
- Role-based statistics
- Search and filter capabilities

### 6. Personal Features
- **My Profile**: View complete profile information (read-only)
- **Logout**: Secure logout with session clearing

## 🎨 Design System

### Colors
- **Primary**: #f6421f (Orange-red)
- **Secondary**: #ee8724 (Amber-orange)
- **Tertiary**: #fbcb29 (Yellow)
- **Text Dark**: #212121
- **Text Light**: #ffffff

### Typography
- **Headers**: Lexend font family
- **Body**: Roboto font family

### UI Components
- Rounded cards with soft shadows
- Gradient buttons with hover effects
- Smooth animations (fadeIn, slideUp, scaleIn)
- Custom scrollbars matching theme
- Toast notifications (bottom-center position)

## 🔧 Technical Implementation

### Frontend Stack
- **React** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Recharts** for data visualization
- **qrcode.react** for QR code generation
- **Sonner** for toast notifications
- **Lucide React** for icons

### Data Structure
Currently uses mock data that simulates Google Sheets structure:
- User Profiles
- Master Attendance Log
- Events List
- Announcements
- Feedback
- Access Logs

### Integration Points for Production

To connect with Google Sheets backend, you'll need to:

1. **Setup Google Sheets API**:
   - Create a Google Cloud project
   - Enable Google Sheets API
   - Create OAuth 2.0 credentials
   - Install google-auth-library and googleapis packages

2. **Replace Mock Data**:
   - Update `/components/LoginScreen.tsx` to authenticate against User Profiles sheet
   - Modify attendance components to read/write from Master Attendance Log
   - Connect announcement/feedback components to respective sheets

3. **Add Real-Time Updates**:
   - Implement polling or webhooks for live data sync
   - Add loading states during data fetch
   - Handle network errors gracefully

4. **Email Integration**:
   - Setup email service (SendGrid, AWS SES, etc.)
   - Implement email sending for announcements
   - Add email notifications for feedback replies

## 📦 Component Structure

```
/components
├── TopBar.tsx                    # Navigation bar with theme toggle
├── Sidebar.tsx                   # Collapsible sidebar navigation
├── LoginScreen.tsx               # Login interface
├── Homepage.tsx                  # Organization homepage
├── OfficerSearch.tsx             # Officer directory search
├── AttendanceDashboard.tsx       # Attendance pie charts
├── AttendanceAnalytics.tsx       # Detailed attendance analytics
├── QRScanner.tsx                 # QR code scanner interface
├── MyQRID.tsx                    # Personal QR code display
├── ManualAttendance.tsx          # Manual attendance entry
├── ManageEvents.tsx              # Event creation/management
├── AttendanceTransparency.tsx    # Personal attendance records
├── Announcements.tsx             # Announcements system
├── Feedback.tsx                  # Feedback submission/management
├── AccessLogs.tsx                # Login activity logs
└── MyProfile.tsx                 # User profile display
```

## 🚀 Getting Started

1. The app starts at the login screen
2. Use one of the demo accounts to login
3. Navigate using the sidebar menu
4. Features are filtered based on your role
5. Toggle dark mode using the moon/sun icon in the top-right

## 📝 Notes

- All timestamps use Philippine Standard Time (PST)
- Toast notifications appear at bottom-center for 4 seconds total (1s fade-in, 2s visible, 1s fade-out)
- Sidebar groups expand/collapse with smooth animations
- Modal backgrounds darken with semi-transparent overlay
- All forms include validation with error messages
- Back buttons maintain navigation history

## 🔐 Security Notes

- This is a frontend-only demonstration
- In production, implement proper authentication
- Never store sensitive data in localStorage
- Use HTTPS for all communications
- Implement API rate limiting
- Sanitize all user inputs
- Follow GDPR/data privacy guidelines

## 📊 Mock Data Summary

- **5 User Profiles** (1 Admin, 2 Heads, 1 Auditor, 1 Member)
- **4 Events** with attendance data
- **3 Announcements** with different recipient types
- **3 Feedback** entries with replies
- **12 Access Log** entries
- **Committee Data** for 4 committees

## 🎯 Future Enhancements

- Real-time QR scanning using device camera
- Export attendance reports to PDF/Excel
- Push notifications for announcements
- Mobile app version
- Advanced analytics dashboard
- Bulk attendance import
- Event calendar view
- Member directory with photos
- Training module integration
- Document repository

---

**Built with ❤️ for Youth Service Philippines - Tagum Chapter**
