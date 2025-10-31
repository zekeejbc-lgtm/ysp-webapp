import { useState, useEffect, lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoginScreen from './components/LoginScreen';
import { Toaster } from './components/ui/sonner';
import { queryClient } from './services/queryClient';
import './styles/globals.css';

// Lazy load all page components for better performance
const Homepage = lazy(() => import('./components/Homepage'));
const OfficerSearch = lazy(() => import('./components/OfficerSearch'));
const AttendanceDashboard = lazy(() => import('./components/AttendanceDashboard'));
const QRScanner = lazy(() => import('./components/QRScanner'));
const ManualAttendance = lazy(() => import('./components/ManualAttendance'));
const ManageEvents = lazy(() => import('./components/ManageEvents'));
const MyQRID = lazy(() => import('./components/MyQRID'));
const AttendanceTransparency = lazy(() => import('./components/AttendanceTransparency'));
const Announcements = lazy(() => import('./components/Announcements'));
const Feedback = lazy(() => import('./components/Feedback'));
const AccessLogs = lazy(() => import('./components/AccessLogs'));
const MyProfile = lazy(() => import('./components/MyProfile'));
const SystemTools = lazy(() => import('./components/SystemTools'));

// Loading fallback component
function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-[#f6421f] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading page...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(() => {
    // Restore last visited page from localStorage
    return localStorage.getItem('currentPage') || 'homepage';
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for existing session on mount (session persistence)
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Check if user is banned
        if (userData.role === 'Banned') {
          console.log('Banned user attempted to restore session:', userData.name);
          toast.error('Your account has been restricted. Please contact an administrator.');
          localStorage.removeItem('userData');
          return;
        }
        console.log('Restoring session for user:', userData.name);
        setCurrentUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('userData');
      }
    }
  }, []);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (user: any) => {
    // Check if user is banned
    if (user.role === 'Banned') {
      toast.error('Your account has been restricted. Please contact an administrator.');
      return;
    }
    setCurrentUser(user);
    setIsLoggedIn(true);
    setCurrentPage('homepage');
    // Save to localStorage for session persistence
    localStorage.setItem('userData', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage('homepage');
    // Clear session and page from localStorage
    localStorage.removeItem('userData');
    localStorage.removeItem('currentPage');
  };

  // Centralized role-based access control for pages
  const canAccess = (page: string, role: string | undefined): boolean => {
    if (!role) return false;
    // Banned users have no access to any pages
    if (role === 'Banned') return false;
    const accessMap: Record<string, string[]> = {
      homepage: ['Admin', 'Head', 'Auditor', 'Member', 'Guest'],
      'officer-search': ['Admin', 'Head', 'Auditor'],
      'attendance-dashboard': ['Admin', 'Head', 'Auditor'],
      'qr-scanner': ['Admin', 'Head', 'Auditor'],
      'manual-attendance': ['Admin', 'Head', 'Auditor'],
      'manage-events': ['Admin', 'Auditor'],
      'my-qr-id': ['Admin', 'Head', 'Auditor', 'Member'],
      'attendance-transparency': ['Admin', 'Head', 'Auditor', 'Member'],
      announcements: ['Admin', 'Head', 'Auditor', 'Member'],
      feedback: ['Admin', 'Head', 'Auditor', 'Member', 'Guest'],
      'access-logs': ['Auditor'],
      'system-tools': ['Auditor'],
      'my-profile': ['Admin', 'Head', 'Auditor', 'Member'],
    };
    // Unknown pages default to no access
    return accessMap[page]?.includes(role) ?? false;
  };

  // Navigation helper that enforces access and provides feedback
  const handleNavigate = (page: string) => {
    const role = currentUser?.role as string | undefined;
    if (canAccess(page, role)) {
      setCurrentPage(page);
    } else {
      toast.error('Access denied for your role.');
    }
  };

  // Additional check: if user is banned, force logout
  useEffect(() => {
    if (isLoggedIn && currentUser?.role === 'Banned') {
      toast.error('Your account has been restricted. You have been logged out.');
      handleLogout();
    }
  }, [isLoggedIn, currentUser]);

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} darkMode={darkMode} setDarkMode={setDarkMode} />
        {/* Let Toaster component choose best position per device */}
        <Toaster />
      </>
    );
  }
  const renderPage = () => {
    // Guard against unauthorized currentPage values
    const role = currentUser?.role as string | undefined;
    if (!canAccess(currentPage, role)) {
      return <Homepage darkMode={darkMode} currentUser={currentUser} />;
    }
    switch (currentPage) {
      case 'homepage':
        return <Homepage darkMode={darkMode} currentUser={currentUser} />;
      case 'officer-search':
        return <OfficerSearch darkMode={darkMode} />;
      case 'attendance-dashboard':
        return <AttendanceDashboard darkMode={darkMode} />;
      case 'qr-scanner':
        return <QRScanner currentUser={currentUser} />;
      case 'manual-attendance':
        return <ManualAttendance currentUser={currentUser} />;
      case 'manage-events':
        return <ManageEvents />;
      case 'my-qr-id':
        return <MyQRID currentUser={currentUser} />;
      case 'attendance-transparency':
        return <AttendanceTransparency darkMode={darkMode} currentUser={currentUser} />;
      case 'announcements':
        return <Announcements darkMode={darkMode} currentUser={currentUser} />;
      case 'feedback':
        return <Feedback darkMode={darkMode} currentUser={currentUser} />;
      case 'access-logs':
        return <AccessLogs darkMode={darkMode} />;
      case 'system-tools':
        return <SystemTools currentUser={currentUser} />;
      case 'my-profile':
        return <MyProfile currentUser={currentUser} />;
      default:
        return <Homepage darkMode={darkMode} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user" transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}>
        <div className={`app-container ${darkMode ? 'dark' : ''}`}>
          <TopBar darkMode={darkMode} setDarkMode={setDarkMode} setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />
          
          <div className="main-layout">
            <Sidebar 
              isOpen={sidebarOpen} 
              currentPage={currentPage} 
              setCurrentPage={handleNavigate}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
            
            <main className="content-area">
              <Suspense fallback={<PageLoadingFallback />}>
                {renderPage()}
              </Suspense>
            </main>
          </div>
          
          {/* Let Toaster component choose best position per device */}
          <Toaster />
        </div>
      </MotionConfig>
    </QueryClientProvider>
  );
}
