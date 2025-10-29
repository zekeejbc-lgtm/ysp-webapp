import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { userAPI, eventsAPI, type UserProfile, type Event } from '../services/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle } from 'lucide-react';

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
            <div className="mt-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
                    className="absolute top-full left-0 right-0 z-10 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700"
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
              </div>

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
            <div className="mt-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
                    className="absolute top-full left-0 right-0 z-10 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700"
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
                    className="absolute top-full left-0 right-0 z-10 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 text-center text-gray-500"
                  >
                    No active events found
                  </motion.div>
                )}
              </div>
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

      {/* Overwrite Confirmation Inline Card (no modal) */}
      {showOverwriteDialog && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252839] shadow-xl">
            {/* Header with icon and close button */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white font-semibold">Overwrite Attendance</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Warning Message */}
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-white">{selectedMember?.fullName}</span> already has an attendance record for this event.
              </p>

              {/* Current Record Box */}
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#1a1d2e]">
                <div className="mb-3 text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Current Record:
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Member:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selectedMember?.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Event:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{selectedEvent?.name}</span>
                  </div>
                  <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{existingRecord}</span>
                  </div>
                </div>
              </div>

              {/* New Value Indicator */}
              <div className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/30">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  New {timeType === 'timeIn' ? 'Time In' : 'Time Out'}: <span className="font-semibold text-orange-900 dark:text-orange-200">{status} - {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </p>
              </div>
            </CardContent>

            {/* Footer with actions */}
            <CardFooter className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={handleCancelOverwrite}
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmOverwrite} 
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Change
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
