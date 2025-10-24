import React, { useState } from 'react';
import { Search, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Input } from './ui/input';

interface AccessLogsProps {
  darkMode: boolean;
}

// Mock access logs data
const mockAccessLogs = [
  { id: 1, name: 'Juan Dela Cruz', idCode: 'YSP-001', role: 'Admin', timestamp: '2024-10-24 09:15 AM' },
  { id: 2, name: 'Maria Santos', idCode: 'YSP-002', role: 'Head', timestamp: '2024-10-24 09:30 AM' },
  { id: 3, name: 'John Visitor', idCode: 'GUEST-1234', role: 'Guest', timestamp: '2024-10-24 10:00 AM' },
  { id: 4, name: 'Pedro Reyes', idCode: 'YSP-003', role: 'Auditor', timestamp: '2024-10-24 10:15 AM' },
  { id: 5, name: 'Ana Garcia', idCode: 'YSP-004', role: 'Member', timestamp: '2024-10-24 10:45 AM' },
  { id: 6, name: 'Carlos Martinez', idCode: 'YSP-005', role: 'Head', timestamp: '2024-10-24 11:00 AM' },
  { id: 7, name: 'Juan Dela Cruz', idCode: 'YSP-001', role: 'Admin', timestamp: '2024-10-24 11:30 AM' },
  { id: 8, name: 'Sarah Guest', idCode: 'GUEST-5678', role: 'Guest', timestamp: '2024-10-24 01:00 PM' },
  { id: 9, name: 'Sofia Lopez', idCode: 'YSP-006', role: 'Member', timestamp: '2024-10-24 01:30 PM' },
  { id: 10, name: 'Miguel Torres', idCode: 'YSP-007', role: 'Member', timestamp: '2024-10-24 02:00 PM' },
  { id: 11, name: 'Pedro Reyes', idCode: 'YSP-003', role: 'Auditor', timestamp: '2024-10-24 02:15 PM' },
  { id: 12, name: 'Maria Santos', idCode: 'YSP-002', role: 'Head', timestamp: '2024-10-24 02:45 PM' }
];

export default function AccessLogs({ darkMode }: AccessLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = searchTerm
    ? mockAccessLogs.filter(log =>
        log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.idCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : mockAccessLogs;

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
    return mockAccessLogs.filter(log => log.role === role).length;
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
        {filteredLogs.map((log, index) => (
          <motion.div
            key={log.id}
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
