import React, { useState } from 'react';
import { Search, Plus, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';

interface AnnouncementsProps {
  darkMode: boolean;
  currentUser: any;
}

const recipientOptions = [
  { value: 'All', label: 'All Members' },
  { value: 'Head', label: 'Only Heads' },
  { value: 'Programs', label: 'Programs Committee' },
  { value: 'Logistics', label: 'Logistics Committee' },
  { value: 'Media', label: 'Media Committee' },
  { value: 'Finance', label: 'Finance Committee' },
  { value: 'YSP-001', label: 'Juan Dela Cruz (YSP-001)' },
  { value: 'YSP-002', label: 'Maria Santos (YSP-002)' },
  { value: 'YSP-003', label: 'Pedro Reyes (YSP-003)' }
];

export default function Announcements({ darkMode, currentUser }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Upcoming General Assembly',
      subject: 'Important Meeting Announcement',
      body: 'Dear YSP Members, we are pleased to announce our upcoming General Assembly scheduled for October 15, 2024 at 2:00 PM. This is a mandatory meeting for all active members. We will discuss important matters regarding upcoming projects and organizational updates. Please mark your calendars and ensure your attendance. Thank you!',
      author: 'Juan Dela Cruz',
      date: '2024-10-08',
      read: false,
      recipient: 'All',
      recipientLabel: 'All Members'
    },
    {
      id: 2,
      title: 'Community Clean-Up Drive Success',
      subject: 'Event Update',
      body: 'Congratulations to all volunteers who participated in our Community Clean-Up Drive last October 10, 2024! We successfully mobilized 38 volunteers and collected over 150 kilograms of waste materials. Your dedication and hard work made this event a huge success. Special thanks to the Logistics Committee for the excellent coordination. More photos will be shared on our social media pages.',
      author: 'Maria Santos',
      date: '2024-10-11',
      read: true,
      recipient: 'All',
      recipientLabel: 'All Members'
    },
    {
      id: 3,
      title: 'Committee Head Meeting Reminder',
      subject: 'Meeting Schedule',
      body: 'This is a reminder for all Committee Heads to attend the monthly coordination meeting on October 18, 2024 at 4:00 PM. We will be discussing budget allocations and project timelines for the next quarter. Please prepare your committee reports and bring necessary documents.',
      author: 'Juan Dela Cruz',
      date: '2024-10-12',
      read: false,
      recipient: 'Head',
      recipientLabel: 'Only Heads'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<typeof announcements[0] | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [recipientType, setRecipientType] = useState('All');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientSuggestions, setShowRecipientSuggestions] = useState(false);

  const canCreate = currentUser && ['Admin', 'Head', 'Auditor'].includes(currentUser.role);

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = searchTerm
      ? a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subject.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesRecipient = a.recipient === 'All' || a.recipient === currentUser.role || a.recipient === currentUser.idCode;
    
    return matchesSearch && matchesRecipient;
  });

  const filteredRecipients = recipientSearch
    ? recipientOptions.filter(r =>
        r.label.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        r.value.toLowerCase().includes(recipientSearch.toLowerCase())
      )
    : recipientOptions;

  const handleCreateAnnouncement = () => {
    if (!newTitle || !newSubject || !newBody) {
      toast.error('Please fill in all fields');
      return;
    }

    const recipientLabel = recipientOptions.find(r => r.value === recipientType)?.label || recipientType;

    const newAnnouncement = {
      id: announcements.length + 1,
      title: newTitle,
      subject: newSubject,
      body: newBody,
      author: currentUser.fullName,
      date: new Date().toISOString().split('T')[0],
      read: false,
      recipient: recipientType,
      recipientLabel
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    
    toast.success('Announcement created successfully', {
      description: 'Email notification sent to all recipients'
    });

    // Reset form
    setNewTitle('');
    setNewSubject('');
    setNewBody('');
    setRecipientType('All');
    setRecipientSearch('');
    setShowCreateModal(false);
  };

  const handleMarkAsRead = (id: number) => {
    setAnnouncements(announcements.map(a =>
      a.id === id ? { ...a, read: true } : a
    ));
    toast.success('Marked as read');
  };

  return (
    <div className="max-w-5xl mx-auto">
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
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {canCreate && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29] shadow-lg shadow-orange-300/50"
              >
                <Plus className="mr-2" size={18} />
                Create
              </Button>
            </motion.div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredAnnouncements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedAnnouncement(announcement)}
              className="ysp-card bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-800 dark:to-gray-700 cursor-pointer hover:shadow-xl transition-all duration-300 border border-orange-100 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-[#f6421f] dark:text-[#ee8724] flex-1 pr-2">{announcement.title}</h4>
                {!announcement.read && (
                  <Badge className="bg-[#f6421f] shadow-md">New</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{announcement.subject}</p>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{announcement.body}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>By {announcement.author}</span>
                <span>{announcement.date}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No announcements found
          </div>
        )}
      </motion.div>

      {/* View Announcement Modal */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="modal-content max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-2">{selectedAnnouncement.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{selectedAnnouncement.subject}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-500">By {selectedAnnouncement.author}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{selectedAnnouncement.date}</span>
                    <span className="text-gray-400">•</span>
                    <Badge className="bg-blue-500 flex items-center gap-1">
                      <Users size={12} />
                      {selectedAnnouncement.recipientLabel}
                    </Badge>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="mb-6 max-h-96 overflow-y-auto">
                <p className="text-justify whitespace-pre-wrap leading-relaxed">{selectedAnnouncement.body}</p>
              </div>

              <div className="flex gap-3">
                {!selectedAnnouncement.read && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={() => {
                        handleMarkAsRead(selectedAnnouncement.id);
                        setSelectedAnnouncement(null);
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      Mark as Read
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="w-full bg-gray-500 hover:bg-gray-600"
                  >
                    Close
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Announcement Modal */}
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
              className="modal-content max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-[#f6421f] dark:text-[#ee8724]">Create Announcement</h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Enter subject"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="recipient">Recipient Type</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      type="text"
                      placeholder="Search recipients..."
                      value={recipientSearch}
                      onChange={(e) => {
                        setRecipientSearch(e.target.value);
                        setShowRecipientSuggestions(true);
                      }}
                      onFocus={() => setShowRecipientSuggestions(true)}
                      className="pl-10"
                    />

                    {showRecipientSuggestions && filteredRecipients.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700"
                      >
                        {filteredRecipients.map((recipient) => (
                          <button
                            key={recipient.value}
                            onClick={() => {
                              setRecipientType(recipient.value);
                              setRecipientSearch(recipient.label);
                              setShowRecipientSuggestions(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <p>{recipient.label}</p>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                  {recipientType && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2"
                    >
                      <Badge className="bg-blue-500">
                        <Users size={12} className="mr-1" />
                        {recipientOptions.find(r => r.value === recipientType)?.label || recipientType}
                      </Badge>
                    </motion.div>
                  )}
                </div>

                <div>
                  <Label htmlFor="body">Body</Label>
                  <Textarea
                    id="body"
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Enter announcement content"
                    className="mt-2 min-h-[150px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    onClick={handleCreateAnnouncement}
                    className="w-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29]"
                  >
                    Create & Send
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
