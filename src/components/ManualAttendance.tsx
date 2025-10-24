import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';

interface ManualAttendanceProps {
  darkMode: boolean;
  currentUser: any;
}

const mockMembers = [
  { idCode: 'YSP-001', fullName: 'Juan Dela Cruz', position: 'President' },
  { idCode: 'YSP-002', fullName: 'Maria Santos', position: 'Committee Head' },
  { idCode: 'YSP-003', fullName: 'Pedro Reyes', position: 'Auditor' },
  { idCode: 'YSP-004', fullName: 'Ana Garcia', position: 'Member' },
  { idCode: 'YSP-005', fullName: 'Carlos Martinez', position: 'Vice President' }
];

const mockEvents = [
  { id: 1, name: 'General Assembly - October 2024', date: '2024-10-15', status: 'Active' },
  { id: 2, name: 'Youth Leadership Summit', date: '2024-10-20', status: 'Active' }
];

export default function ManualAttendance({ darkMode, currentUser }: ManualAttendanceProps) {
  const [memberSearch, setMemberSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<typeof mockMembers[0] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<typeof mockEvents[0] | null>(null);
  const [timeType, setTimeType] = useState<'in' | 'out'>('in');
  const [status, setStatus] = useState('Present');
  const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);

  const filteredMembers = memberSearch
    ? mockMembers.filter(m =>
        m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.idCode.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : mockMembers;

  const filteredEvents = eventSearch
    ? mockEvents.filter(e => e.name.toLowerCase().includes(eventSearch.toLowerCase()))
    : mockEvents;

  const handleSubmit = () => {
    if (!selectedMember || !selectedEvent) {
      toast.error('Please select both member and event');
      return;
    }

    const timestamp = new Date().toLocaleTimeString('en-PH', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // In production, this would write to Google Sheets
    console.log(`Manual Attendance: ${selectedMember.idCode} - ${selectedEvent.name} - ${timeType === 'in' ? 'Time In' : 'Time Out'}: ${status} - ${timestamp}`);

    toast.success('Attendance recorded successfully', {
      description: `${selectedMember.fullName} - ${status} at ${timestamp}`
    });

    // Reset form
    setSelectedMember(null);
    setSelectedEvent(null);
    setMemberSearch('');
    setEventSearch('');
    setStatus('Present');
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
          {/* Member Selection */}
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

              {showMemberSuggestions && filteredMembers.length > 0 && memberSearch && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700"
                >
                  {filteredMembers.map((member) => (
                    <button
                      key={member.idCode}
                      onClick={() => {
                        setSelectedMember(member);
                        setMemberSearch(member.fullName);
                        setShowMemberSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <p>{member.fullName}</p>
                      <p className="text-sm text-gray-500">{member.idCode} - {member.position}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {selectedMember && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <p className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  Selected: {selectedMember.fullName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedMember.idCode} - {selectedMember.position}</p>
              </motion.div>
            )}
          </div>

          {/* Event Selection */}
          <div>
            <Label>Select Event</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search for an event..."
                value={eventSearch}
                onChange={(e) => {
                  setEventSearch(e.target.value);
                  setShowEventSuggestions(true);
                  setSelectedEvent(null);
                }}
                onFocus={() => setShowEventSuggestions(true)}
                className="pl-10"
              />

              {showEventSuggestions && filteredEvents.length > 0 && eventSearch && (
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
                      <p>{event.name}</p>
                      <p className="text-sm text-gray-500">{event.date}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {selectedEvent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <p className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  Selected: {selectedEvent.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.date}</p>
              </motion.div>
            )}
          </div>

          {/* Time Type */}
          <div>
            <Label>Time Type</Label>
            <div className="flex gap-4 mt-2">
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
          </div>

          {/* Status */}
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

          {/* Submit Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29] shadow-lg shadow-orange-300/50"
            >
              Record Attendance
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
