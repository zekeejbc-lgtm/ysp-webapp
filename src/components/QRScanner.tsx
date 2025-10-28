import { useState, useEffect } from 'react';
import { Search, Camera, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { eventsAPI } from '../services/api';
import type { Event } from '../services/api';

interface QRScannerProps {
  darkMode: boolean;
  currentUser: any;
}

export default function QRScanner({ darkMode, currentUser }: QRScannerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [timeType, setTimeType] = useState<'timeIn' | 'timeOut'>('timeIn');
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch active events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      if (response.success && response.events) {
        // Filter only active events
        const activeEvents = response.events.filter(e => e.status === 'Active');
        setEvents(activeEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  const filteredEvents = searchTerm
    ? events.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : events;

  const handleStartScanning = () => {
    if (!selectedEvent) {
      toast.error('Please select an event first', {
        description: 'Choose an active event from the list'
      });
      return;
    }
    setIsScanning(true);
    toast.success('QR Scanner started', {
      description: 'Point camera at QR code to record attendance'
    });
    
    // TODO: Implement html5-qrcode camera scanning
    // For now, simulate with prompt
    setTimeout(() => {
      const simulatedQR = prompt('DEMO: Enter ID Code to simulate QR scan:');
      if (simulatedQR) {
        handleQRScan(simulatedQR.trim());
      } else {
        setIsScanning(false);
      }
    }, 500);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    toast.info('QR Scanner stopped');
  };

  const handleQRScan = async (idCode: string) => {
    if (!selectedEvent) return;
    
    setIsLoading(true);
    try {
      // Call backend to record attendance
      const response = await fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recordAttendance',
          eventId: selectedEvent.id,
          idCode: idCode,
          timeType: timeType
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Attendance recorded!', {
          description: `${result.personName} - ${result.time}`
        });
      } else if (result.alreadyRecorded) {
        toast.error('Already recorded!', {
          description: result.message
        });
      } else {
        toast.error('Recording failed', {
          description: result.message || 'Unable to record attendance'
        });
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Recording failed', {
        description: 'Unable to connect to server'
      });
    } finally {
      setIsLoading(false);
      setIsScanning(false);
    }
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
            <label className="block text-sm font-medium mb-2">Select Event</label>
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
                        setSelectedEvent(event);
                        setSearchTerm(event.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-gray-500">{event.date}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {showSuggestions && filteredEvents.length === 0 && searchTerm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center text-gray-500"
                >
                  No active events found
                </motion.div>
              )}
            </div>
          </div>

          {/* Time Type Selection */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTimeType('timeIn')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 shadow-md ${
                timeType === 'timeIn'
                  ? 'bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white shadow-lg shadow-orange-300/50'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Time In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTimeType('timeOut')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 shadow-md ${
                timeType === 'timeOut'
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-300/50"
                >
                  <Square className="mr-2" size={18} />
                  {isLoading ? 'Recording...' : 'Stop Scanning'}
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
              <p className="text-lg font-medium">Camera Active</p>
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
            Note: Camera scanning will be implemented with html5-qrcode library
          </p>
        </motion.div>
      )}

      {selectedEvent && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ysp-card bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800"
        >
          <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-2 font-medium">Selected Event</h3>
          <p className="mb-1 font-medium">{selectedEvent.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Date: {selectedEvent.date}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Recording: <span className="font-medium text-[#f6421f] dark:text-[#ee8724]">
              {timeType === 'timeIn' ? 'Time In' : 'Time Out'}
            </span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
