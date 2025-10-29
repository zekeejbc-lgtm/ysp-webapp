import { useState, useEffect } from 'react';
import { Search, Plus, X, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { announcementsAPI, userAPI, type Announcement } from '../services/api';

interface AnnouncementsProps {
  darkMode: boolean;
  currentUser: any;
}

// Committee mapping for recipient dropdown
const COMMITTEES = [
  'Membership and Internal Affairs Committee',
  'Communications and Marketing Committee',
  'Finance and Treasury Committee',
  'Secretariat and Documentation Committee',
  'External Relations Committee',
  'Program Development Committee'
];

export default function Announcements({ currentUser }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  
  // Create form fields
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [recipientType, setRecipientType] = useState<'All Members' | 'Only Heads' | 'Specific Committee' | 'Specific Person/s'>('All Members');
  const [recipientValue, setRecipientValue] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Check if user can create announcements (Heads, Auditor, Admin)
  const canCreateAnnouncements = currentUser && (
    currentUser.role === 'Head' ||
    currentUser.role === 'Auditor' ||
    currentUser.role === 'Admin'
  );
  
  console.log('[Announcements] Can create announcements:', canCreateAnnouncements);
  console.log('[Announcements] Current user role:', currentUser?.role);

  // Load announcements on mount
  useEffect(() => {
    console.log('[Announcements] currentUser:', currentUser);
    console.log('[Announcements] currentUser.id:', currentUser?.id);
    console.log('[Announcements] currentUser.idCode:', currentUser?.idCode);
    
    if (currentUser?.idCode || currentUser?.id) {
      loadAnnouncements();
    } else {
      console.error('[Announcements] No valid ID found in currentUser');
      setLoading(false);
      toast.error('User ID not found. Please log in again.');
    }
  }, [currentUser]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Use idCode first, fallback to id
      const userId = currentUser.idCode || currentUser.id;
      console.log('[Announcements] Loading announcements for user ID:', userId);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const apiPromise = announcementsAPI.getAll(userId);
      
      const response = await Promise.race([apiPromise, timeoutPromise]) as any;
      
      if (response.success && response.announcements) {
        setAnnouncements(response.announcements);
        toast.success(`Loaded ${response.announcements.length} announcements`);
      } else {
        toast.error(response.message || 'Failed to load announcements');
        console.error('API Response:', response);
      }
    } catch (error: any) {
      console.error('Error loading announcements:', error);
      
      if (error.message === 'Request timeout') {
        toast.error('Backend not responding. Please update Google Apps Script and redeploy.');
      } else {
        toast.error('Error loading announcements. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Search users for "Specific Person/s" recipient type
  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const response = await userAPI.searchProfiles(searchTerm);
      if (response.success && response.profiles) {
        setUserSuggestions(response.profiles);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Filter announcements by search term
  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort announcements by date (newest first) and unread first
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    // First, sort by read status (unread first)
    if (a.readStatus === 'Unread' && b.readStatus !== 'Unread') return -1;
    if (a.readStatus !== 'Unread' && b.readStatus === 'Unread') return 1;
    
    // Then sort by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleCreateAnnouncement = async () => {
    // Debug logging
    console.log('=== CREATE ANNOUNCEMENT VALIDATION ===');
    console.log('Title:', newTitle);
    console.log('Subject:', newSubject);
    console.log('Body:', newBody);
    console.log('Recipient Type:', recipientType);
    console.log('Recipient Value:', recipientValue);
    console.log('Selected Users:', selectedUsers);
    console.log('======================================');

    // Validate all required fields
    if (!newTitle.trim()) {
      console.error('VALIDATION FAILED: Title is empty');
      toast.error('Missing required fields', {
        description: 'Please enter a title'
      });
      return;
    }

    if (!newSubject.trim()) {
      console.error('VALIDATION FAILED: Subject is empty');
      toast.error('Missing required fields', {
        description: 'Please enter a subject'
      });
      return;
    }

    if (!newBody.trim()) {
      console.error('VALIDATION FAILED: Body is empty');
      toast.error('Missing required fields', {
        description: 'Please enter the announcement body'
      });
      return;
    }

    if (!recipientType) {
      console.error('VALIDATION FAILED: Recipient type not selected');
      toast.error('Missing required fields', {
        description: 'Please select a recipient type'
      });
      return;
    }

    // Validate recipient value based on type
    let finalRecipientValue = recipientValue;
    
    if (recipientType === 'All Members') {
      finalRecipientValue = 'All Members';
    } else if (recipientType === 'Only Heads') {
      finalRecipientValue = 'Only Heads';
    } else if (recipientType === 'Specific Committee') {
      if (!recipientValue || !COMMITTEES.includes(recipientValue)) {
        console.error('VALIDATION FAILED: Committee not selected');
        toast.error('Missing required fields', {
          description: 'Please select a committee'
        });
        return;
      }
    } else if (recipientType === 'Specific Person/s') {
      if (selectedUsers.length === 0) {
        console.error('VALIDATION FAILED: No users selected. selectedUsers:', selectedUsers);
        toast.error('Missing required fields', {
          description: 'Please select at least one recipient'
        });
        return;
      }
      finalRecipientValue = selectedUsers.join(', ');
    }

    console.log('VALIDATION PASSED! Final recipient value:', finalRecipientValue);

    const requestData = {
      title: newTitle.trim(),
      subject: newSubject.trim(),
      body: newBody.trim(),
      recipientType,
      recipientValue: finalRecipientValue,
      authorIdCode: currentUser.idCode || currentUser.id,
      authorName: currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`,
    };
    
    console.log('Sending to API:', JSON.stringify(requestData, null, 2));

    try {
      setCreating(true);
      const response = await announcementsAPI.create(requestData);

      if (response.success) {
        toast.success('Announcement created successfully!', {
          description: 'Email notifications have been sent to all recipients'
        });
        
        // Reset form
        setNewTitle('');
        setNewSubject('');
        setNewBody('');
        setRecipientType('All Members');
        setRecipientValue('');
        setRecipientSearch('');
        setSelectedUsers([]);
        setShowCreateModal(false);
        
        // Reload announcements
        await loadAnnouncements();
      } else {
        toast.error(response.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Error creating announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleMarkAsRead = async (announcement: Announcement) => {
    if (announcement.readStatus === 'Read') return;

    try {
      const response = await announcementsAPI.markAsRead(announcement.announcementId, currentUser.idCode || currentUser.id);
      
      if (response.success) {
        // Update local state
        setAnnouncements(announcements.map(a =>
          a.announcementId === announcement.announcementId
            ? { ...a, readStatus: 'Read' }
            : a
        ));
        
        // Update selected announcement if viewing
        if (selectedAnnouncement?.announcementId === announcement.announcementId) {
          setSelectedAnnouncement({ ...announcement, readStatus: 'Read' });
        }
        
        toast.success('Marked as read');
      } else {
        toast.error(response.message || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Error marking as read');
    }
  };

  const handleRecipientTypeChange = (type: typeof recipientType) => {
    setRecipientType(type);
    setRecipientValue('');
    setRecipientSearch('');
    setSelectedUsers([]);
  };

  const handleAddUser = (idCode: string) => {
    if (!selectedUsers.includes(idCode)) {
      setSelectedUsers([...selectedUsers, idCode]);
      setRecipientSearch('');
      setUserSuggestions([]);
    }
  };

  const handleRemoveUser = (idCode: string) => {
    setSelectedUsers(selectedUsers.filter(u => u !== idCode));
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#f6421f]" size={32} />
      </div>
    );
  }

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

          {canCreateAnnouncements && (
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
          {sortedAnnouncements.map((announcement, index) => (
            <motion.div
              key={announcement.announcementId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedAnnouncement(announcement)}
              className="ysp-card bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-800 dark:to-gray-700 cursor-pointer hover:shadow-xl transition-all duration-300 border border-orange-100 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-[#f6421f] dark:text-[#ee8724] flex-1 pr-2">{announcement.title}</h4>
                {announcement.readStatus === 'Unread' && (
                  <Badge className="bg-[#f6421f] shadow-md">New</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{announcement.subject}</p>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{announcement.body}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>By {announcement.authorName}</span>
                <span>{formatDate(announcement.timestamp)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {sortedAnnouncements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No announcements found matching your search' : 'No announcements available'}
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
                    <span className="text-sm text-gray-500">By {selectedAnnouncement.authorName}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{formatDate(selectedAnnouncement.timestamp)}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">ID: {selectedAnnouncement.announcementId}</span>
                    <span className="text-gray-400">•</span>
                    <Badge className="bg-blue-500 flex items-center gap-1">
                      <Users size={12} />
                      {selectedAnnouncement.recipientType}
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
                {selectedAnnouncement.readStatus === 'Unread' && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={() => {
                        handleMarkAsRead(selectedAnnouncement);
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
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="recipientType">Recipient Type *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={recipientType === 'All Members' ? 'default' : 'outline'}
                      onClick={() => handleRecipientTypeChange('All Members')}
                      className={recipientType === 'All Members' ? 'bg-[#f6421f] hover:bg-[#ee8724]' : ''}
                    >
                      All Members
                    </Button>
                    <Button
                      type="button"
                      variant={recipientType === 'Only Heads' ? 'default' : 'outline'}
                      onClick={() => handleRecipientTypeChange('Only Heads')}
                      className={recipientType === 'Only Heads' ? 'bg-[#f6421f] hover:bg-[#ee8724]' : ''}
                    >
                      Only Heads
                    </Button>
                    <Button
                      type="button"
                      variant={recipientType === 'Specific Committee' ? 'default' : 'outline'}
                      onClick={() => handleRecipientTypeChange('Specific Committee')}
                      className={recipientType === 'Specific Committee' ? 'bg-[#f6421f] hover:bg-[#ee8724]' : ''}
                    >
                      Specific Committee
                    </Button>
                    <Button
                      type="button"
                      variant={recipientType === 'Specific Person/s' ? 'default' : 'outline'}
                      onClick={() => handleRecipientTypeChange('Specific Person/s')}
                      className={recipientType === 'Specific Person/s' ? 'bg-[#f6421f] hover:bg-[#ee8724]' : ''}
                    >
                      Specific Person/s
                    </Button>
                  </div>
                </div>

                {recipientType === 'Specific Committee' && (
                  <div>
                    <Label htmlFor="committee">Select Committee *</Label>
                    <select
                      id="committee"
                      value={recipientValue}
                      onChange={(e) => setRecipientValue(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select a committee...</option>
                      {COMMITTEES.map((committee) => (
                        <option key={committee} value={committee}>
                          {committee}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {recipientType === 'Specific Person/s' && (
                  <div>
                    <Label htmlFor="personSearch">Search and Select Recipients *</Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <Input
                        id="personSearch"
                        type="text"
                        placeholder="Type name or ID code..."
                        value={recipientSearch}
                        onChange={(e) => {
                          setRecipientSearch(e.target.value);
                          searchUsers(e.target.value);
                        }}
                        className="pl-10"
                      />
                    </div>
                    
                    {userSuggestions.length > 0 && recipientSearch && (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
                        {userSuggestions.map((user) => (
                          <button
                            key={user.idCode}
                            type="button"
                            onClick={() => handleAddUser(user.idCode)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                          >
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-gray-500">{user.idCode}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedUsers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedUsers.map((idCode) => (
                          <Badge key={idCode} className="bg-blue-500 flex items-center gap-1">
                            {idCode}
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(idCode)}
                              className="ml-1 hover:text-red-300"
                            >
                              <X size={12} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="body">Body *</Label>
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
                    disabled={creating}
                    className="w-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29]"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={18} />
                        Creating...
                      </>
                    ) : (
                      'Create & Send'
                    )}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
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
