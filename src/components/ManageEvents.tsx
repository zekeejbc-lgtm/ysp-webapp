import { useState, useEffect } from 'react';
import { Search, Plus, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { eventsAPI, type Event } from '../services/api';

export default function ManageEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await eventsAPI.getAll();
      if (response.success && response.events) {
        setEvents(response.events);
      } else {
        toast.error(response.message || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = searchTerm
    ? events.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : events;

  const handleToggleStatus = async (eventId: string, currentStatus: string) => {
    try {
      const response = await eventsAPI.toggleStatus(eventId, currentStatus);
      if (response.success) {
        // Update local state
        setEvents(events.map(e =>
          e.id === eventId ? { ...e, status: currentStatus === 'Active' ? 'Inactive' : 'Active' } : e
        ));
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        toast.success(`Event ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
      } else {
        toast.error(response.message || 'Failed to toggle event status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle event status');
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName || !newEventDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await eventsAPI.create(newEventName, newEventDate);
      if (response.success) {
        toast.success('Event created successfully', {
          description: 'Event columns added to Master Attendance Log'
        });
        // Refresh events list
        await fetchEvents();
        // Reset form
        setNewEventName('');
        setNewEventDate('');
        setShowCreateModal(false);
      } else {
        toast.error(response.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ysp-card mb-6"
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29] shadow-lg shadow-orange-300/50"
            >
              <Plus className="mr-2" size={18} />
              Create Event
            </Button>
          </motion.div>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading events...</p>
            </div>
          )}
          
          {!isLoading && filteredEvents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No events found</p>
            </div>
          )}

          {!isLoading && filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="ysp-card bg-gradient-to-r from-gray-50 to-orange-50/30 dark:from-gray-800 dark:to-gray-700 hover:shadow-xl transition-all duration-300 border border-orange-100 dark:border-gray-600"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Calendar size={24} className="text-[#f6421f]" />
                  <div className="flex-1">
                    <h4 className="text-[#f6421f] dark:text-[#ee8724]">{event.name}</h4>
                    <p className="text-sm text-gray-500">{event.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-sm px-3 py-1 rounded-full ${event.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {event.status}
                  </span>
                  <Switch
                    checked={event.status === 'Active'}
                    onCheckedChange={() => handleToggleStatus(event.id, event.status)}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="modal-content max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-[#f6421f] dark:text-[#ee8724]">Create New Event</h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    type="text"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    placeholder="Enter event name"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={handleCreateEvent}
                      className="w-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29]"
                    >
                      Create
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={() => setShowCreateModal(false)}
                      className="w-full bg-gray-500 hover:bg-gray-600"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Note: Creating an event automatically adds 5 columns in Master Attendance Log: Date, Event Name, Time In, Time Out, Event Status
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
