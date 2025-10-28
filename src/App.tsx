import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Homepage from './components/Homepage';
import OfficerSearch from './components/OfficerSearch';
import AttendanceDashboard from './components/AttendanceDashboard';

import QRScanner from './components/QRScanner';
import ManualAttendance from './components/ManualAttendance';
import ManageEvents from './components/ManageEvents';
import MyQRID from './components/MyQRID';
import AttendanceTransparency from './components/AttendanceTransparency';
import Announcements from './components/Announcements';
import Feedback from './components/Feedback';
import AccessLogs from './components/AccessLogs';
import MyProfile from './components/MyProfile';
import LoginScreen from './components/LoginScreen';
import { Toaster } from './components/ui/sonner';
import './styles/globals.css';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('homepage');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setCurrentPage('homepage');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage('homepage');
  };

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} darkMode={darkMode} setDarkMode={setDarkMode} />
        <Toaster position="top-center" />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'homepage':
        return <Homepage darkMode={darkMode} />;
      case 'officer-search':
        return <OfficerSearch darkMode={darkMode} />;
      case 'attendance-dashboard':
        return <AttendanceDashboard darkMode={darkMode} />;
      case 'qr-scanner':
        return <QRScanner darkMode={darkMode} currentUser={currentUser} />;
      case 'manual-attendance':
        return <ManualAttendance darkMode={darkMode} currentUser={currentUser} />;
      case 'manage-events':
        return <ManageEvents darkMode={darkMode} currentUser={currentUser} />;
      case 'my-qr-id':
        return <MyQRID darkMode={darkMode} currentUser={currentUser} />;
      case 'attendance-transparency':
        return <AttendanceTransparency darkMode={darkMode} currentUser={currentUser} />;
      case 'announcements':
        return <Announcements darkMode={darkMode} currentUser={currentUser} />;
      case 'feedback':
        return <Feedback darkMode={darkMode} currentUser={currentUser} />;
      case 'access-logs':
        return <AccessLogs darkMode={darkMode} />;
      case 'my-profile':
        return <MyProfile darkMode={darkMode} currentUser={currentUser} />;
      default:
        return <Homepage darkMode={darkMode} />;
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      <TopBar darkMode={darkMode} setDarkMode={setDarkMode} setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />
      
      <div className="main-layout">
        <Sidebar 
          isOpen={sidebarOpen} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          currentUser={currentUser}
          onLogout={handleLogout}
          darkMode={darkMode}
        />
        
        <main className="content-area">
          {renderPage()}
        </main>
      </div>
      
      <Toaster position="top-center" />
    </div>
  );
}
