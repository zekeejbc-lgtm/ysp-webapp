import { useState, useEffect, type ChangeEvent } from 'react';
import { Search, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';

interface AccessLogsProps {
  darkMode: boolean;
}

interface AccessLog {
  name: string;
  idCode: string;
  role: string;
  timestamp: string;
}

const API_URL = 'https://script.google.com/macros/s/AKfycbyepq64QJEfXRzACKaXGSevEXdb-TueUaxtnTEQCnnFsECZGq1AWqNqyKZ9GeMmvcao2g/exec';

export default function AccessLogs({ darkMode }: AccessLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // reference unused vars so TypeScript doesn't warn; these are intentionally
  // present to preserve the component's API and internal state handling
  void darkMode;
  void isLoading;
  void error;

  // Check if user is authorized (role === "Auditor")
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const { role } = JSON.parse(userData);
      if (role !== 'Auditor') {
        window.location.href = '/homepage';
      }
    } else {
      window.location.href = '/homepage';
    }
  }, []);

  // Fetch access logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const userData = localStorage.getItem('userData');
        const role = userData ? JSON.parse(userData).role : null;

        const response = await fetch(API_URL, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify({
            action: 'getAccessLogs',
            role
          })
        });

        const data = await response.json();
        console.log('Access logs response:', data);

        if (data.success) {
          // Backend returns { success: true, logs: [...] }
          setLogs(data.logs || []);
        } else {
          setError(data.message || 'Failed to fetch access logs');
        }
      } catch (error) {
        setError('Failed to fetch access logs');
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = searchTerm
    ? logs.filter(log =>
        log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.idCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : logs;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'Head':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'Auditor':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'Member':
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
      case 'Guest':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getRoleCount = (role: string) => {
    return logs.filter(log => log.role === role).length;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ysp-card mb-6"
      >
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4">Access Logs</h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search by name or ID code..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
        {filteredLogs.map((log, index) => (
          <motion.div
            key={`${log.timestamp}-${log.idCode}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="ysp-card bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Clock size={24} className="text-[#f6421f]" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-[#f6421f] dark:text-[#ee8724]">
                      {log.name}
                    </h4>
                    <span className={`text-xs px-3 py-1 rounded-full text-white shadow-md ${getRoleBadgeColor(log.role)}`}>
                      {log.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">ID: {log.idCode}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm">{log.timestamp.split(' ')[0]}</p>
                <p className="text-sm text-gray-500">{log.timestamp.split(' ')[1]} {log.timestamp.split(' ')[2]}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ysp-card text-center py-12"
        >
          <p className="text-gray-500">No access logs found</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="ysp-card mt-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Admin Logins</p>
            <p className="text-3xl text-red-600 dark:text-red-400">{getRoleCount('Admin')}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Head Logins</p>
            <p className="text-3xl text-blue-600 dark:text-blue-400">{getRoleCount('Head')}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Auditor Logins</p>
            <p className="text-3xl text-green-600 dark:text-green-400">{getRoleCount('Auditor')}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-300 dark:border-gray-500"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Member Logins</p>
            <p className="text-3xl text-gray-600 dark:text-gray-400">{getRoleCount('Member')}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Guest Logins</p>
            <p className="text-3xl text-yellow-600 dark:text-yellow-400">{getRoleCount('Guest')}</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
