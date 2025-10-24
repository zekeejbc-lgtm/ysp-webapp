import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AttendanceDashboardProps {
  darkMode: boolean;
}

// Mock events and attendance data
const mockEvents = [
  { id: 1, name: 'General Assembly - October 2024', date: '2024-10-15', status: 'Completed' },
  { id: 2, name: 'Community Clean-Up Drive', date: '2024-10-10', status: 'Completed' },
  { id: 3, name: 'Youth Leadership Summit', date: '2024-10-20', status: 'Active' },
  { id: 4, name: 'Tree Planting Activity', date: '2024-10-05', status: 'Completed' }
];

const mockCommittees = [
  { id: 'all', name: 'All Committees' },
  { id: 'programs', name: 'Programs Committee' },
  { id: 'logistics', name: 'Logistics Committee' },
  { id: 'media', name: 'Media Committee' },
  { id: 'finance', name: 'Finance Committee' }
];

const mockAttendanceData = {
  1: {
    all: { Present: 45, Late: 8, Absent: 12, Excused: 5, NotRecorded: 3, Total: 73 },
    programs: { Present: 12, Late: 2, Absent: 1, Excused: 0, NotRecorded: 0, Total: 15 },
    logistics: { Present: 10, Late: 1, Absent: 1, Excused: 0, NotRecorded: 0, Total: 12 },
    media: { Present: 9, Late: 0, Absent: 0, Excused: 1, NotRecorded: 0, Total: 10 },
    finance: { Present: 6, Late: 1, Absent: 1, Excused: 0, NotRecorded: 0, Total: 8 }
  },
  2: {
    all: { Present: 38, Late: 5, Absent: 15, Excused: 7, NotRecorded: 2, Total: 67 },
    programs: { Present: 10, Late: 2, Absent: 2, Excused: 1, NotRecorded: 0, Total: 15 },
    logistics: { Present: 8, Late: 1, Absent: 2, Excused: 1, NotRecorded: 0, Total: 12 },
    media: { Present: 8, Late: 0, Absent: 1, Excused: 1, NotRecorded: 0, Total: 10 },
    finance: { Present: 5, Late: 1, Absent: 1, Excused: 1, NotRecorded: 0, Total: 8 }
  },
  3: {
    all: { Present: 52, Late: 6, Absent: 8, Excused: 4, NotRecorded: 1, Total: 71 },
    programs: { Present: 13, Late: 1, Absent: 1, Excused: 0, NotRecorded: 0, Total: 15 },
    logistics: { Present: 11, Late: 0, Absent: 1, Excused: 0, NotRecorded: 0, Total: 12 },
    media: { Present: 9, Late: 1, Absent: 0, Excused: 0, NotRecorded: 0, Total: 10 },
    finance: { Present: 7, Late: 0, Absent: 0, Excused: 1, NotRecorded: 0, Total: 8 }
  },
  4: {
    all: { Present: 41, Late: 9, Absent: 10, Excused: 6, NotRecorded: 4, Total: 70 },
    programs: { Present: 11, Late: 2, Absent: 1, Excused: 1, NotRecorded: 0, Total: 15 },
    logistics: { Present: 9, Late: 2, Absent: 1, Excused: 0, NotRecorded: 0, Total: 12 },
    media: { Present: 8, Late: 1, Absent: 0, Excused: 1, NotRecorded: 0, Total: 10 },
    finance: { Present: 5, Late: 2, Absent: 1, Excused: 0, NotRecorded: 0, Total: 8 }
  }
};

// Mock attendee names
const mockAttendeeNames = {
  Present: ['Juan Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Garcia', 'Carlos Martinez', 'Sofia Lopez', 'Miguel Torres', 'Isabella Gonzalez'],
  Late: ['Roberto Diaz', 'Patricia Morales', 'Fernando Castro'],
  Absent: ['Jose Rivera', 'Carmen Flores', 'Antonio Vargas'],
  Excused: ['Lucia Mendoza', 'Francisco Jimenez']
};

const COLORS = {
  Present: '#4ade80',
  Late: '#fbbf24',
  Absent: '#f87171',
  Excused: '#60a5fa',
  NotRecorded: '#9ca3af'
};

export default function AttendanceDashboard({ darkMode }: AttendanceDashboardProps) {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);

  const filteredEvents = searchTerm
    ? mockEvents.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : mockEvents;

  const selectedEventData = selectedEvent && mockAttendanceData[selectedEvent as keyof typeof mockAttendanceData]
    ? mockAttendanceData[selectedEvent as keyof typeof mockAttendanceData][selectedCommittee as keyof typeof mockAttendanceData[1]]
    : null;

  const chartData = selectedEventData
    ? [
        { name: 'Present', value: selectedEventData.Present },
        { name: 'Late', value: selectedEventData.Late },
        { name: 'Absent', value: selectedEventData.Absent },
        { name: 'Excused', value: selectedEventData.Excused },
        { name: 'Not Recorded', value: selectedEventData.NotRecorded }
      ].filter(item => item.value > 0)
    : [];

  const toggleStatus = (status: string) => {
    setExpandedStatus(expandedStatus === status ? null : status);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="ysp-card mb-6"
      >
        <h2 className="text-[#f6421f] dark:text-[#ee8724] mb-4">Attendance Dashboard & Analytics</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Event Selection */}
          <div className="relative">
            <label className="block text-sm mb-2">Select Event</label>
            <Search className="absolute left-3 top-11 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search for an event..."
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
                    <p className="text-sm text-gray-500">{event.date} - {event.status}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Committee Selection */}
          <div>
            <label className="block text-sm mb-2">Select Committee</label>
            <Select value={selectedCommittee} onValueChange={setSelectedCommittee}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockCommittees.map((committee) => (
                  <SelectItem key={committee.id} value={committee.id}>
                    {committee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {selectedEvent && selectedEventData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="ysp-card">
            <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-4">
              {mockEvents.find(e => e.id === selectedEvent)?.name}
              {selectedCommittee !== 'all' && ` - ${mockCommittees.find(c => c.id === selectedCommittee)?.name}`}
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {/* Present */}
                {selectedEventData.Present > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <button
                      onClick={() => toggleStatus('Present')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg hover:shadow-md transition-all duration-200 border border-green-200 dark:border-green-800"
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-400" />
                        <span>Present</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {selectedEventData.Present}
                        {expandedStatus === 'Present' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                    <AnimatePresence>
                      {expandedStatus === 'Present' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800 overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2">
                            {mockAttendeeNames.Present.slice(0, selectedEventData.Present).map((name, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-sm rounded">
                                {name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Late */}
                {selectedEventData.Late > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <button
                      onClick={() => toggleStatus('Late')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg hover:shadow-md transition-all duration-200 border border-yellow-200 dark:border-yellow-800"
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-400" />
                        <span>Late</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {selectedEventData.Late}
                        {expandedStatus === 'Late' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                    <AnimatePresence>
                      {expandedStatus === 'Late' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-800 overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2">
                            {mockAttendeeNames.Late.slice(0, selectedEventData.Late).map((name, idx) => (
                              <span key={idx} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-sm rounded">
                                {name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Absent */}
                {selectedEventData.Absent > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      onClick={() => toggleStatus('Absent')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg hover:shadow-md transition-all duration-200 border border-red-200 dark:border-red-800"
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-400" />
                        <span>Absent</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {selectedEventData.Absent}
                        {expandedStatus === 'Absent' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                    <AnimatePresence>
                      {expandedStatus === 'Absent' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2">
                            {mockAttendeeNames.Absent.slice(0, selectedEventData.Absent).map((name, idx) => (
                              <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-sm rounded">
                                {name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Excused */}
                {selectedEventData.Excused > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <button
                      onClick={() => toggleStatus('Excused')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg hover:shadow-md transition-all duration-200 border border-blue-200 dark:border-blue-800"
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-400" />
                        <span>Excused</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {selectedEventData.Excused}
                        {expandedStatus === 'Excused' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                    <AnimatePresence>
                      {expandedStatus === 'Excused' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2">
                            {mockAttendeeNames.Excused.slice(0, selectedEventData.Excused).map((name, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-sm rounded">
                                {name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Not Recorded */}
                {selectedEventData.NotRecorded > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400" />
                      Not Recorded
                    </span>
                    <span>{selectedEventData.NotRecorded}</span>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white rounded-lg mt-4 shadow-lg"
                >
                  <span>Total Attendees</span>
                  <span>{selectedEventData.Total}</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ysp-card text-center py-12"
        >
          <p className="text-gray-500 dark:text-gray-400">Select an event and committee to view attendance dashboard</p>
        </motion.div>
      )}
    </div>
  );
}
