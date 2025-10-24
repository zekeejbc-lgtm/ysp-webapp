import React, { useState } from 'react';
import { Search, Camera, Square } from 'lucide-react';
import { motion } from 'motion/react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface QRScannerProps {
  darkMode: boolean;
  currentUser: any;
}

const mockEvents = [
  { id: 1, name: 'General Assembly - October 2024', date: '2024-10-15', status: 'Active' },
  { id: 2, name: 'Community Clean-Up Drive', date: '2024-10-10', status: 'Inactive' },
  { id: 3, name: 'Youth Leadership Summit', date: '2024-10-20', status: 'Active' }
];

export default function QRScanner({ darkMode, currentUser }: QRScannerProps) {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [timeType, setTimeType] = useState<'in' | 'out'>('in');
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const activeEvents = mockEvents.filter(e => e.status === 'Active');
  const filteredEvents = searchTerm
    ? activeEvents.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : activeEvents;

  const handleStartScanning = () => {
    if (!selectedEvent) {
      toast.error('Please select an event first');
      return;
    }
    setIsScanning(true);
    toast.success('QR Scanner started. Point camera at QR code.');
    
    // Simulate QR scan after 3 seconds
    setTimeout(() => {
      handleQRScan('YSP-004'); // Simulated scan
    }, 3000);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    toast.info('QR Scanner stopped');
  };

  const handleQRScan = (idCode: string) => {
    // In production, this would write to Google Sheets Master Attendance Log
    const timestamp = new Date().toLocaleTimeString('en-PH', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const status = 'Present';
    const eventName = mockEvents.find(e => e.id === selectedEvent)?.name;
    
    console.log(`Attendance Recorded: ${idCode} - ${eventName} - ${timeType === 'in' ? 'Time In' : 'Time Out'}: ${status} - ${timestamp}`);
    
    toast.success(`Attendance recorded for ${idCode}`, {
      description: `${timeType === 'in' ? 'Time In' : 'Time Out'}: ${timestamp}`
    });
    
    setIsScanning(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="ysp-card mb-6"
      >
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4">QR Attendance Scanner</h2>
        
        <div className="space-y-4">
          {/* Event Selection */}
          <div>
            <label className="block text-sm mb-2">Select Event</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search for an active event..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10"
              />

              {showSuggestions && filteredEvents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700"
                >
                  {filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event.id);
                        setSearchTerm(event.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <p>{event.name}</p>
                      <p className="text-sm text-gray-500">{event.date}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Time Type Selection */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTimeType('in')}
              className={`flex-1 py-3 rounded-lg transition-all duration-300 shadow-md ${
                timeType === 'in'
                  ? 'bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white shadow-lg shadow-orange-300/50'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Time In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTimeType('out')}
              className={`flex-1 py-3 rounded-lg transition-all duration-300 shadow-md ${
                timeType === 'out'
                  ? 'bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white shadow-lg shadow-orange-300/50'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Time Out
            </motion.button>
          </div>

          {/* Scanner Control */}
          <div className="flex gap-4">
            {!isScanning ? (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <Button
                  onClick={handleStartScanning}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-300/50"
                >
                  <Camera className="mr-2" size={18} />
                  Start Scanning
                </Button>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <Button
                  onClick={handleStopScanning}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-300/50"
                >
                  <Square className="mr-2" size={18} />
                  Stop Scanning
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Scanner Display */}
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ysp-card"
        >
          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
            <div className="relative z-10 text-center text-white">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Camera size={64} className="mx-auto mb-4" />
              </motion.div>
              <p>Camera Active</p>
              <p className="text-sm text-gray-400 mt-2">Point camera at QR code</p>
              <motion.div
                animate={{ 
                  borderColor: ['#f6421f', '#ee8724', '#fbcb29', '#f6421f']
                }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="mt-4 w-48 h-48 border-4 border-dashed rounded-lg mx-auto"
              />
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Note: In production, this will use Html5Qrcode library to access device camera
          </p>
        </motion.div>
      )}

      {selectedEvent && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ysp-card"
        >
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-2">Selected Event</h3>
          <p className="mb-1">{mockEvents.find(e => e.id === selectedEvent)?.name}</p>
          <p className="text-sm text-gray-500">
            Recording: {timeType === 'in' ? 'Time In' : 'Time Out'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
