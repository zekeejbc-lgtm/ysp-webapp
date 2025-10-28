import { useState, useEffect } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { userAPI, eventsAPI, type UserProfile, type Event } from '../services/api';

interface ManualAttendanceProps {
  currentUser: any;
}

export default function ManualAttendance(_props: ManualAttendanceProps) {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [timeType, setTimeType] = useState<'timeIn' | 'timeOut'>('timeIn');
  const [status, setStatus] = useState('Present');
  const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [existingRecord, setExistingRecord] = useState('');

  // Fetch active events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      if (response.success && response.events) {
        const activeEvents = response.events.filter(e => e.status === 'Active');
        setEvents(activeEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  // Search members when user types
  useEffect(() => {
    const searchMembers = async () => {
      if (memberSearch.length < 2) {
        setMembers([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await userAPI.searchProfiles(memberSearch);
        if (response.success && response.profiles) {
          setMembers(response.profiles);
        }
      } catch (error) {
        console.error('Error searching members:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchMembers, 300);
    return () => clearTimeout(debounce);
  }, [memberSearch]);

  const filteredEvents = eventSearch
    ? events.filter(e => e.name.toLowerCase().includes(eventSearch.toLowerCase()))
    : events;

  const handleSubmit = async (overwrite = false) => {
    if (!selectedMember || !selectedEvent) {
      toast.error('Please select both member and event');
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date();
      const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      const hours = phTime.getUTCHours();
      const minutes = phTime.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const timeString = String(displayHours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ' ' + ampm;
      const formattedValue = `${status} - ${timeString}`;

      const requestData = {
        action: 'recordManualAttendance',
        eventId: selectedEvent.id,
        idCode: selectedMember.idCode,
        timeType: timeType,
        status: status,
        formattedValue: formattedValue,
        overwrite: overwrite
      };

      const response = await fetch('/api/gas-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ Attendance Recorded!', {
          description: `${selectedMember.fullName} - ${status} at ${timeString}`
        });
        setSelectedMember(null);
        setSelectedEvent(null);
        setMemberSearch('');
        setEventSearch('');
        setStatus('Present');
        setShowOverwriteDialog(false);
        setPendingData(null);
      } else if (result.alreadyRecorded && !overwrite) {
        // Show overwrite dialog
        setExistingRecord(result.existingValue || 'Unknown');
        setPendingData(requestData);
        setShowOverwriteDialog(true);
      } else {
        toast.error('Recording Failed', {
          description: result.message || 'Unable to record attendance'
        });
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Recording Failed', {
        description: 'Unable to connect to server'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOverwrite = async () => {
    if (pendingData) {
      setShowOverwriteDialog(false);
      await handleSubmit(true);
    }
  };

  const handleCancelOverwrite = () => {
    setShowOverwriteDialog(false);
    setPendingData(null);
    setIsLoading(false);
    toast.info('Cancelled', {
      description: 'Record was not overwritten'
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="ysp-card"
      >
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-6">Manual Attendance</h2>

        <div className="space-y-6">
          <div>
            <Label>Select Member</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by name or ID code..."
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setShowMemberSuggestions(true);
                  setSelectedMember(null);
                }}
                onFocus={() => setShowMemberSuggestions(true)}
                className="pl-10"
              />

              {showMemberSuggestions && members.length > 0 && memberSearch.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700"
                >
                  {members.map((member) => (
                    <button
                      key={member.idCode}
                      onClick={() => {
                        setSelectedMember(member);
                        setMemberSearch(member.fullName);
                        setShowMemberSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <p className="font-medium">{member.fullName}</p>
                      <p className="text-sm text-gray-500">{member.idCode} - {member.position}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {isSearching && memberSearch.length >= 2 && (
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              )}
            </div>

            {selectedMember && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <p className="flex items-center gap-2 font-medium">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  Selected: {selectedMember.fullName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedMember.idCode} - {selectedMember.position}</p>
              </motion.div>
            )}
          </div>

          <div>
            <Label>Select Event</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search for an active event..."
                value={eventSearch}
                onChange={(e) => {
                  setEventSearch(e.target.value);
                  setShowEventSuggestions(true);
                  setSelectedEvent(null);
                }}
                onFocus={() => setShowEventSuggestions(true)}
                className="pl-10"
              />

              {showEventSuggestions && filteredEvents.length > 0 && (
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
                        setEventSearch(event.name);
                        setShowEventSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-gray-500">{event.date}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {showEventSuggestions && filteredEvents.length === 0 && eventSearch && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center text-gray-500"
                >
                  No active events found
                </motion.div>
              )}
            </div>

            {selectedEvent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <p className="flex items-center gap-2 font-medium">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  Selected: {selectedEvent.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.date}</p>
              </motion.div>
            )}
          </div>

          <div>
            <Label>Time Type</Label>
            <div className="flex gap-4 mt-2">
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
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Excused">Excused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isLoading || !selectedMember || !selectedEvent}
              className="w-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29] shadow-lg shadow-orange-300/50"
            >
              {isLoading ? 'Recording...' : 'Record Attendance'}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Overwrite Confirmation Dialog */}
      <AnimatePresence>
        {showOverwriteDialog && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCancelOverwrite}
            >
              {/* Dialog */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 pb-8">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <AlertTriangle className="text-white" size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        Record Already Exists
                      </h3>
                      <p className="text-sm text-white/90">
                        Duplicate attendance detected
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-4 border-2 border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      <span className="text-[#f6421f] dark:text-[#ee8724] font-semibold">
                        {selectedMember?.fullName}
                      </span>
                      {' '}has already {timeType === 'timeIn' ? 'timed in' : 'timed out'} for this event:
                    </p>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-700/50">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        Current Record:
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#f6421f] to-[#ee8724]"></span>
                        {existingRecord}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center px-2">
                    Do you want to overwrite the existing record with the new one?
                  </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={handleCancelOverwrite}
                      variant="outline"
                      className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={handleConfirmOverwrite}
                      className="w-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29] text-white font-medium shadow-lg shadow-orange-300/50 dark:shadow-orange-900/30"
                    >
                      Overwrite
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
