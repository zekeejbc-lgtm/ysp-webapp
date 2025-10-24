import React, { useState } from 'react';
import { Sun, Moon, LogIn, Eye, EyeOff, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface LoginScreenProps {
  onLogin: (user: any) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

// Mock user data - In production, this would connect to Google Sheets
const mockUsers = [
  { username: 'admin', password: 'admin123', role: 'Admin', idCode: 'YSP-001', fullName: 'Juan Dela Cruz', email: 'admin@ysp.ph', position: 'President' },
  { username: 'head', password: 'head123', role: 'Head', idCode: 'YSP-002', fullName: 'Maria Santos', email: 'head@ysp.ph', position: 'Committee Head' },
  { username: 'auditor', password: 'auditor123', role: 'Auditor', idCode: 'YSP-003', fullName: 'Pedro Reyes', email: 'auditor@ysp.ph', position: 'Auditor' },
  { username: 'member', password: 'member123', role: 'Member', idCode: 'YSP-004', fullName: 'Ana Garcia', email: 'member@ysp.ph', position: 'Member' }
];

export default function LoginScreen({ onLogin, darkMode, setDarkMode }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');

  const handleLogin = () => {
    const user = mockUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Log access in production (would write to Access Logs sheet)
      const timestamp = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
      console.log(`Access Log: ${user.fullName} (${user.idCode}) logged in at ${timestamp}`);
      
      toast.success(`Welcome back, ${user.fullName}!`);
      onLogin(user);
    } else {
      toast.error('Invalid username or password', {
        description: 'Please check your credentials and try again.'
      });
    }
  };

  const handleGuestLogin = () => {
    if (!guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const guestUser = {
      username: 'guest',
      password: '',
      role: 'Guest',
      idCode: `GUEST-${Date.now().toString().slice(-4)}`,
      fullName: guestName,
      email: 'guest@ysp.ph',
      position: 'Visitor'
    };

    // Log guest access
    const timestamp = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
    console.log(`Access Log: ${guestUser.fullName} (${guestUser.idCode}) logged in as guest at ${timestamp}`);

    toast.success(`Welcome, ${guestName}!`);
    onLogin(guestUser);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark' : ''}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 bg-gradient-to-br from-white via-orange-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300"
      />
      
      <motion.button
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors z-10"
      >
        {darkMode ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} className="text-gray-700" />}
      </motion.button>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 ysp-card max-w-md w-full mx-4"
      >
        <div className="text-center mb-6">
          <motion.img
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=100&h=100&fit=crop" 
            alt="YSP Logo" 
            className="w-20 h-20 rounded-full mx-auto mb-4 shadow-lg"
          />
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[#f6421f] dark:text-[#ee8724] mb-2"
          >
            Youth Service Philippines
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-gray-400"
          >
            Tagum Chapter - Login
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your username"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter your password"
                className="mt-1 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29] text-white shadow-lg shadow-orange-300/50"
            >
              <LogIn className="mr-2" size={18} />
              Login
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setShowGuestModal(true)}
              variant="outline"
              className="w-full border-2 border-[#f6421f] text-[#f6421f] hover:bg-orange-50 dark:hover:bg-gray-800"
            >
              <UserPlus className="mr-2" size={18} />
              Log in as Guest
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-orange-50/50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-orange-100 dark:border-gray-600"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Demo Accounts:</p>
          <div className="text-xs space-y-1 text-gray-500 dark:text-gray-500">
            <p>• Admin: admin / admin123</p>
            <p>• Head: head / head123</p>
            <p>• Auditor: auditor / auditor123</p>
            <p>• Member: member / member123</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Guest Login Modal */}
      <AnimatePresence>
        {showGuestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowGuestModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="modal-content max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-[#f6421f] dark:text-[#ee8724] flex items-center gap-2">
                  <UserPlus size={24} />
                  Guest Login
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowGuestModal(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="guestName">Your Name</Label>
                  <Input
                    id="guestName"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGuestLogin()}
                    placeholder="Enter your full name"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Your access will be recorded in the system logs.
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={handleGuestLogin}
                      className="w-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29]"
                    >
                      Continue as Guest
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={() => setShowGuestModal(false)}
                      className="w-full bg-gray-500 hover:bg-gray-600"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
