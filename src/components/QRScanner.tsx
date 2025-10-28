import { useState, useEffect, useRef } from 'react';
import { Search, Camera, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { eventsAPI } from '../services/api';
import type { Event } from '../services/api';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  currentUser: any;
}

export default function QRScanner(_props: QRScannerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [timeType, setTimeType] = useState<'timeIn' | 'timeOut'>('timeIn');
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Fetch active events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current?.isScanning) {
        html5QrcodeRef.current.stop().catch(console.error);
      }
    };
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

    const handleStartScanning = async () => {
    if (!selectedEvent) {
      toast.error('Please select an event first');
      return;
    }

    try {
      // First, show the scanner container
      setIsScanning(true);
      
      // Wait for DOM to update before initializing scanner
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html5Qrcode = new Html5Qrcode("qr-reader");
      html5QrcodeRef.current = html5Qrcode;

      // Request camera permissions and start scanning
      const cameras = await Html5Qrcode.getCameras();
      
      if (cameras && cameras.length > 0) {
        const cameraId = cameras[cameras.length - 1].id; // Use back camera (last one)
        
        await html5Qrcode.start(
          cameraId,
          { 
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            handleQRScan(decodedText);
          },
          () => {
            // Scan errors (no QR detected) - ignore
          }
        );

        toast.success('Camera ready!', {
          description: 'Point at a QR code to scan'
        });
      } else {
        throw new Error('No cameras found');
      }
    } catch (err) {
      console.error('Camera error:', err);
      setIsScanning(false);
      
      const error = err as Error;
      const errorMsg = error.message || error.toString();
      
      if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission')) {
        toast.error('Camera Permission Denied', {
          description: 'Please click "Allow" when your browser asks for camera access'
        });
      } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('No cameras')) {
        toast.error('No Camera Found', {
          description: 'Please ensure your device has a camera'
        });
      } else if (errorMsg.includes('NotReadableError')) {
        toast.error('Camera In Use', {
          description: 'Close other apps using the camera and try again'
        });
      } else if (errorMsg.includes('OverconstrainedError')) {
        toast.error('Camera Error', {
          description: 'Camera doesn\'t support the requested settings'
        });
      } else {
        toast.error('Camera Error', {
          description: errorMsg || 'Unable to access camera'
        });
      }
    }
  };

  const handleStopScanning = async () => {
    if (html5QrcodeRef.current?.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current = null;
        setIsScanning(false);
        toast.info('Camera stopped');
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
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
          idCode: idCode.trim(),
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
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
          
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            📱 Point your camera at a QR code to scan
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
