import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { eventsAPI, Event, EventAnalytics } from '../services/api';
import { ChartSkeleton } from './ui/skeletons';

interface AttendanceDashboardProps {
  darkMode: boolean;
}

const COMMITTEE_OPTIONS = [
  { id: 'all', name: 'All Committees' },
  { id: 'heads', name: 'All Heads' },
  { id: 'YSPTIR', name: 'Membership and Internal Affairs Committee' },
  { id: 'YSPTCM', name: 'Communications and Marketing Committee' },
  { id: 'YSPTFR', name: 'Finance and Treasury Committee' },
  { id: 'YSPTSD', name: 'Secretariat and Documentation Committee' },
  { id: 'YSPTER', name: 'External Relations Committee' },
  { id: 'YSPTPD', name: 'Program Development Committee' }
];

const COLORS = {
  Present: '#4ade80',
  Late: '#fbbf24',
  Absent: '#f87171',
  Excused: '#60a5fa',
  'Not Recorded': '#9ca3af'
};

export default function AttendanceDashboard({ }: AttendanceDashboardProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Load analytics when event or committee changes
  useEffect(() => {
    if (selectedEvent) {
      loadAnalytics(selectedEvent.id, selectedCommittee);
    }
  }, [selectedEvent, selectedCommittee]);

  const loadEvents = async () => {
    setLoadingEvents(true);
    setError(null);
    try {
      const response = await eventsAPI.getAll();
      if (response.success && response.events) {
        setEvents(response.events);
      } else {
        setError(response.message || 'Failed to load events');
      }
    } catch (err) {
      setError('Failed to load events: ' + (err as Error).message);
      console.error('Error loading events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadAnalytics = async (eventId: string, committee: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventsAPI.getAnalytics(eventId, committee);
      if (response.success && response.analytics) {
        setAnalytics(response.analytics);
        setTotalAttendees(response.totalAttendees || 0);
      } else {
        setError(response.message || 'Failed to load analytics');
        setAnalytics(null);
        setTotalAttendees(0);
      }
    } catch (err) {
      setError('Failed to load analytics: ' + (err as Error).message);
      setAnalytics(null);
      setTotalAttendees(0);
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = searchTerm
    ? events.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : events;

  const chartData = analytics
    ? [
        { name: 'Present', value: analytics.Present.count },
        { name: 'Late', value: analytics.Late.count },
        { name: 'Absent', value: analytics.Absent.count },
        { name: 'Excused', value: analytics.Excused.count },
        { name: 'Not Recorded', value: analytics['Not Recorded'].count }
      ].filter(item => item.value > 0)
    : [];

  const toggleStatus = (status: string) => {
    setExpandedStatus(expandedStatus === status ? null : status);
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setSearchTerm(event.name);
    setShowSuggestions(false);
    setExpandedStatus(null); // Reset expanded status when changing events
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
              <Input
                type="text"
                placeholder={loadingEvents ? "Loading events..." : "Search for an event..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10"
                disabled={loadingEvents}
              />
              {loadingEvents && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" size={20} />
              )}
            </div>

            {showSuggestions && filteredEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700"
              >
                {filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event)}
                    className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <p className="font-medium">{event.name}</p>
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
                {COMMITTEE_OPTIONS.map((committee) => (
                  <SelectItem key={committee.id} value={committee.id}>
                    {committee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </motion.div>

      {loading && <ChartSkeleton />}

      {!loading && selectedEvent && analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="ysp-card">
            <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-4">
              {selectedEvent.name}
              {selectedCommittee !== 'all' && ` - ${COMMITTEE_OPTIONS.find(c => c.id === selectedCommittee)?.name}`}
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-80">
                {chartData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    No attendance data available
                  </div>
                )}
              </div>

              {/* Status Breakdown */}
              <div className="space-y-3">
                {/* Present */}
                {analytics.Present.count > 0 && (
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
                        <span className="font-medium">Present</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold">{analytics.Present.count}</span>
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
                            {analytics.Present.attendees.map((attendee, idx) => (
                              <span 
                                key={idx} 
                                className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-sm rounded-full"
                                title={`${attendee.position} - ${attendee.committee}`}
                              >
                                {attendee.name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Late */}
                {analytics.Late.count > 0 && (
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
                        <span className="font-medium">Late</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold">{analytics.Late.count}</span>
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
                            {analytics.Late.attendees.map((attendee, idx) => (
                              <span 
                                key={idx} 
                                className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-sm rounded-full"
                                title={`${attendee.position} - ${attendee.committee}`}
                              >
                                {attendee.name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Absent */}
                {analytics.Absent.count > 0 && (
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
                        <span className="font-medium">Absent</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold">{analytics.Absent.count}</span>
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
                            {analytics.Absent.attendees.map((attendee, idx) => (
                              <span 
                                key={idx} 
                                className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-sm rounded-full"
                                title={`${attendee.position} - ${attendee.committee}`}
                              >
                                {attendee.name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Excused */}
                {analytics.Excused.count > 0 && (
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
                        <span className="font-medium">Excused</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold">{analytics.Excused.count}</span>
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
                            {analytics.Excused.attendees.map((attendee, idx) => (
                              <span 
                                key={idx} 
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-sm rounded-full"
                                title={`${attendee.position} - ${attendee.committee}`}
                              >
                                {attendee.name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Not Recorded */}
                {analytics['Not Recorded'].count > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      onClick={() => toggleStatus('Not Recorded')}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-lg hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-400" />
                        <span className="font-medium">Not Recorded</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold">{analytics['Not Recorded'].count}</span>
                        {expandedStatus === 'Not Recorded' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                    <AnimatePresence>
                      {expandedStatus === 'Not Recorded' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2">
                            {analytics['Not Recorded'].attendees.map((attendee, idx) => (
                              <span 
                                key={idx} 
                                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-full"
                                title={`${attendee.position} - ${attendee.committee}`}
                              >
                                {attendee.name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Total Attendees */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white rounded-lg mt-4 shadow-lg"
                >
                  <span className="font-semibold">Total Attendees</span>
                  <span className="text-xl font-bold">{totalAttendees}</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!loading && !selectedEvent && !loadingEvents && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ysp-card text-center py-12"
        >
          <p className="text-gray-500 dark:text-gray-400">Select an event to view attendance dashboard and analytics</p>
        </motion.div>
      )}
    </div>
  );
}
