import { useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ChangeEvent } from 'react';
import { Sun, Moon, LogIn, Eye, EyeOff, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { authAPI } from '../services/api';

import type { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function LoginScreen({ onLogin, darkMode, setDarkMode }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting login...');
      const data = await authAPI.login(username, password);
      console.log('Login response:', data);
      
      if (data.success && data.user) {
        // Map backend user data to frontend format
        const userData = {
          name: `${data.user.firstName} ${data.user.lastName}`,
          idCode: data.user.id,
          role: data.user.role
        };
        
        // Save user data to localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
        
        toast.success(`Welcome back, ${userData.name}!`);
        onLogin(userData as User);
      } else {
        toast.error(data.message || 'Login failed', {
          description: 'Please check your credentials and try again.'
        });
      }
    } catch (error) {
      toast.error('Login failed', {
        description: 'Please try again later.'
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authAPI.guestLogin(guestName.trim());
      
      if (data.success && data.user) {
        // Map guest data to frontend format
        const userData = {
          name: data.user.firstName,
          idCode: data.user.id,
          role: data.user.role
        };
        
        // Save guest data to localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
        
        toast.success(`Welcome, ${userData.name}!`);
        onLogin(userData as User);
      } else {
        toast.error('Guest login failed', {
          description: data.message || 'Please try again.'
        });
      }
    } catch (error) {
      toast.error('Guest login failed', {
        description: 'Please try again later.'
      });
      console.error('Guest login error:', error);
    } finally {
      setIsLoading(false);
      setShowGuestModal(false);
    }
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              onKeyPress={(e: ReactKeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleLogin()}
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                onKeyPress={(e: ReactKeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleLogin()}
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <LogIn size={18} />
                    </motion.div>
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2" size={18} />
                    Login
                  </>
                )}
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
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setGuestName(e.target.value)}
                    onKeyPress={(e: ReactKeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleGuestLogin()}
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
