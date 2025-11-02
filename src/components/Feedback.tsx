import { useState, useEffect } from 'react';
import { Search, Plus, X, MessageCircle, RefreshCw, Image as ImageIcon, Eye, EyeOff, Star, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { feedbackAPI, type Feedback as FeedbackType } from '../services/api';
import { CardSkeleton } from './ui/skeletons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useRef } from 'react';
import { Switch } from './ui/switch';

interface FeedbackProps {
  darkMode: boolean;
  currentUser: any;
}

export default function Feedback({ darkMode: _darkMode, currentUser }: FeedbackProps) {
  const [feedbackList, setFeedbackList] = useState<FeedbackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'replied' | 'not-replied'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Other');
  const [newVisibility, setNewVisibility] = useState<'Private' | 'Public'>('Private');
  const [newAnonymous, setNewAnonymous] = useState<boolean>(false);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [newRating, setNewRating] = useState<number>(0);
  const [newEmail, setNewEmail] = useState<string>('');
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyStatus, setReplyStatus] = useState<'Pending' | 'Reviewed' | 'Resolved'>('Reviewed');
  const [replyVisibility, setReplyVisibility] = useState<'Private' | 'Public'>('Private');
  // For replacing a specific image
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  
  // For Admin/Auditor to edit feedback details
  const [editingStatus, setEditingStatus] = useState<'Pending' | 'Reviewed' | 'Resolved'>('Pending');
  const [editingVisibility, setEditingVisibility] = useState<'Private' | 'Public'>('Private');
  const [updatingFeedback, setUpdatingFeedback] = useState(false);

  const canReply = currentUser && ['Admin', 'Auditor'].includes(currentUser.role);
  const isGuest = currentUser && currentUser.role === 'Guest';

  // Fetch feedback on mount
  useEffect(() => {
    fetchFeedback();
  }, [currentUser]);

  // Initialize editing states when feedback is selected
  useEffect(() => {
    if (selectedFeedback) {
      setEditingStatus(selectedFeedback.status as any || 'Pending');
      setEditingVisibility(selectedFeedback.visibility as any || 'Private');
    }
  }, [selectedFeedback]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      
      const idCode = currentUser?.id || currentUser?.idCode || 'guest';
      const name = currentUser?.name || currentUser?.firstName || 'Guest';
      const role = currentUser?.role || 'Guest';
      
      console.log('[Feedback Debug] Fetching feedback for:', { idCode, name, role });
      const response = await feedbackAPI.getAll(idCode, name, role);
      console.log('[Feedback Debug] Fetch response:', response);
      
      if (response.success && Array.isArray(response.feedback)) {
        setFeedbackList(response.feedback);
        console.log('[Feedback Debug] Loaded', response.feedback.length, 'feedback items');
      } else {
        console.error('[Feedback Debug] Failed to fetch feedback:', response.message);
        toast.error(`Failed to load feedback: ${response.message || 'Unknown error'}`, {
          duration: 5000,
          description: 'Try searching by Feedback ID instead'
        });
      }
    } catch (error) {
      console.error('[Feedback Debug] Error fetching feedback:', error);
      const errorMsg = (error instanceof Error) ? error.message : 'Unknown error';
      toast.error(`Failed to load feedback: ${errorMsg}`, {
        duration: 5000,
        description: 'Try searching by Feedback ID instead'
      });
    } finally {
      setLoading(false);
    }
  };

  // Search by specific Feedback ID if search looks like an ID
  const searchById = async (feedbackId: string) => {
    if (!feedbackId.trim()) return;
    
    try {
      console.log('[Feedback Debug] Searching by ID:', feedbackId);
      toast.loading(`Searching for ${feedbackId}...`);
      
      // Use the getFeedbackByRef API
      const response = await feedbackAPI.getByReference(feedbackId.trim());
      console.log('[Feedback Debug] Search by ID response:', response);
      
      if (response.success && response.feedback) {
        const feedback = Array.isArray(response.feedback) ? response.feedback[0] : response.feedback;
        toast.success(`Found: ${feedbackId}`);
        setSelectedFeedback(feedback);
      } else {
        toast.error(`Feedback not found: ${feedbackId}`);
      }
    } catch (error) {
      console.error('[Feedback Debug] Error searching by ID:', error);
      toast.error('Failed to search feedback');
    }
  };

  // Filter feedback based on search and status
  const filteredFeedback = feedbackList.filter(f => {
    // More robust search that checks multiple fields
    const matchesSearch = searchTerm.trim()
      ? (
          // Search in Reference ID (case-insensitive)
          f.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          // Search in message content (case-insensitive)
          f.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          // Search in author name (case-insensitive)
          f.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          // Search in category (case-insensitive)
          f.category?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : true;

    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'replied' ? f.hasReply :
      !f.hasReply;

    return matchesSearch && matchesFilter;
  });

  const handleCreateFeedback = async () => {
    // Enhanced validation with detailed error messages
    console.log('[Feedback Debug] handleCreateFeedback called');
    console.log('[Feedback Debug] State:', {
      newMessage: newMessage.trim(),
      newRating,
      newImageFilesCount: newImageFiles.length,
      submitting,
      currentUser: currentUser?.name || 'Guest'
    });

    if (!newMessage.trim()) {
      console.error('[Feedback Debug] Validation failed: Empty message');
      toast.error('Please enter your feedback message', { duration: 4000 });
      return;
    }

    if (newRating <= 0) {
      console.error('[Feedback Debug] Validation failed: No rating selected');
      toast.error('⭐ Please provide a star rating (1-5 stars required)', { 
        duration: 5000,
        description: 'Click on the stars above to rate your experience' 
      });
      return;
    }

    if (newImageFiles.length > 3) {
      console.error('[Feedback Debug] Validation failed: Too many images');
      toast.error('Maximum 3 images allowed', { duration: 4000 });
      return;
    }

    try {
      console.log('[Feedback Debug] Starting submission process...');
      setSubmitting(true);

      const debug = (() => {
        try {
          if (typeof window === 'undefined') return false;
          if (new URLSearchParams(window.location.search).get('yspDebug') === '1') return true;
          return window.localStorage.getItem('yspDebug') === '1';
        } catch { return false; }
      })();

      // For now, only upload the first image (backend supports single image)
      // TODO: Update backend to support multiple images
      let imageBase64: string | undefined;
      let imageFilename: string | undefined;
      if (newImageFiles.length > 0) {
        console.log('[Feedback Debug] Processing image upload...');
        const firstImage = newImageFiles[0];
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(firstImage.type.toLowerCase())) {
          console.error('[Feedback Debug] Invalid file type:', firstImage.type);
          toast.error('Only JPG and PNG images are allowed.', { 
            duration: 4000,
            description: 'Please select a .jpg or .png file'
          });
          setSubmitting(false);
          return;
        }
        
        // enforce 10MB limit client-side
        if (firstImage.size > 10 * 1024 * 1024) {
          console.error('[Feedback Debug] Image too large:', firstImage.size);
          toast.error('Image too large. Max size is 10MB.', { duration: 4000 });
          setSubmitting(false);
          return;
        }
        
        try {
          const buffer = await firstImage.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          const mime = firstImage.type || 'image/png';
          imageBase64 = `data:${mime};base64,${base64}`;
          imageFilename = firstImage.name;
          console.log('[Feedback Debug] Image processed successfully:', {
            filename: imageFilename,
            mime,
            size: firstImage.size
          });
        } catch (imgError) {
          console.error('[Feedback Debug] Image processing error:', imgError);
          toast.error('Failed to process image. Please try a different image.', { 
            duration: 4000,
            description: 'The image file may be corrupted or in an unsupported format'
          });
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        message: newMessage.trim(),
        authorName: currentUser?.name || currentUser?.firstName || 'Guest',
        authorIdCode: isGuest ? undefined : (currentUser?.id || currentUser?.idCode),
        anonymous: newAnonymous,
        category: newCategory as any,
        visibility: canReply ? newVisibility : 'Private', // Only Admin/Auditor can set visibility
        rating: newRating,
        email: newEmail || undefined,
        imageBase64,
        imageFilename,
      } as const;

      console.log('[Feedback Debug] Payload prepared:', {
        ...payload,
        imageBase64: payload.imageBase64 ? `[${payload.imageBase64.length} bytes]` : undefined
      });

      if (debug) {
        // eslint-disable-next-line no-console
        console.groupCollapsed('SubmitFeedback → payload');
        const redacted = { ...payload, imageBase64: payload.imageBase64 ? `[base64:${payload.imageBase64.length} bytes]` : undefined };
        // eslint-disable-next-line no-console
        console.log(redacted);
        // eslint-disable-next-line no-console
        console.groupEnd();
      }

      console.log('[Feedback Debug] Calling feedbackAPI.create...');
      const createPromise = feedbackAPI.create(payload);
      
      await toast.promise(createPromise, {
        loading: 'Submitting feedback…',
        success: (data) => {
          console.log('[Feedback Debug] API response received:', data);
          return 'Feedback submitted successfully! 🎉';
        },
        error: (err) => {
          console.error('[Feedback Debug] API error:', err);
          const msg = (err instanceof Error) ? err.message : 'Failed to submit feedback';
          return `Error: ${msg}`;
        },
      });
      
      const response = await createPromise;
      console.log('[Feedback Debug] Full API response:', response);

      if (response.success && response.feedback) {
        const newFeedback = Array.isArray(response.feedback) ? response.feedback[0] : response.feedback;
        console.log('[Feedback Debug] Feedback created successfully:', newFeedback);
        toast.success(`Reference ID: ${newFeedback.referenceId}`, { 
          duration: 5000,
          description: 'Thank you for your feedback!'
        });

        // Reset form
        setNewMessage('');
        setNewCategory('Other');
        setNewVisibility('Private');
        setNewAnonymous(false);
        setNewImageFiles([]);
        setNewImagePreviews([]);
        resetCreateForm();
        setShowCreateModal(false);
        
        // Refresh feedback list
        console.log('[Feedback Debug] Refreshing feedback list...');
        await fetchFeedback();
        console.log('[Feedback Debug] Process completed successfully');
      } else {
        console.error('[Feedback Debug] Unexpected response shape:', response);
        toast.error(`Submission failed: ${response.message || 'Unknown error'}`, { duration: 5000 });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Feedback Debug] Catch block - Error creating feedback:', error);
      console.error('[Feedback Debug] Error stack:', (error as Error)?.stack);
      
      // Show user-friendly error
      const errorMsg = (error instanceof Error) ? error.message : 'Unknown error occurred';
      toast.error(`Failed to submit feedback: ${errorMsg}`, {
        duration: 6000,
        description: 'Please try again or contact support if the issue persists.'
      });
    } finally {
      console.log('[Feedback Debug] Finally block - resetting submitting state');
      setSubmitting(false);
    }
  };
  // Reset create form fields (used by Cancel/Close)
  const resetCreateForm = () => {
    setNewMessage('');
    setNewCategory('Other');
    setNewVisibility('Private');
    setNewAnonymous(false);
    // Revoke all preview URLs
    newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setNewRating(0);
    setNewEmail('');
  };

  // Replace an image at a given index
  const handleReplaceImage = (idx: number) => {
    setReplaceIndex(idx);
    // Trigger hidden file input
    replaceInputRef.current?.click();
  };

  const onReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file == null || replaceIndex == null) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Only JPG and PNG images are allowed.', {
        duration: 4000,
        description: 'Please select a .jpg or .png file'
      });
      e.currentTarget.value = '';
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Max size is 10MB.');
      e.currentTarget.value = '';
      return;
    }
    
    // Update arrays immutably
    setNewImageFiles(prev => {
      const next = [...prev];
      next[replaceIndex] = file;
      return next;
    });
    setNewImagePreviews(prev => {
      const next = [...prev];
      // Revoke old preview URL to avoid memory leaks
      if (next[replaceIndex]) URL.revokeObjectURL(next[replaceIndex]);
      next[replaceIndex] = URL.createObjectURL(file);
      return next;
    });
    // reset
    setReplaceIndex(null);
    e.currentTarget.value = '';
    toast.success('Image replaced');
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedFeedback) {
      toast.error('Please enter your reply');
      return;
    }

    if (!canReply) {
      toast.error('Only Admin and Auditor can reply to feedback');
      return;
    }

    try {
      setSubmitting(true);
      const replyPromise = feedbackAPI.reply({
        referenceId: selectedFeedback.referenceId,
        reply: replyMessage.trim(),
        replierName: currentUser?.name || currentUser?.firstName || 'Admin',
        replierIdCode: currentUser?.id || currentUser?.idCode || '',
        replierRole: currentUser?.role || 'Admin',
        status: replyStatus,
        visibility: replyVisibility,
      });
      await toast.promise(replyPromise, {
        loading: 'Sending reply…',
        success: 'Reply sent successfully',
        error: 'Failed to send reply',
      });
      const response = await replyPromise;

      if (response.success) {
        setReplyMessage('');
        setShowReplyModal(false);
        // Refresh feedback list
        await fetchFeedback();
        // Close the view modal
        setSelectedFeedback(null);
      }
    } catch (error) {
      console.error('Error replying to feedback:', error);
      // Error already surfaced via toast.promise
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ysp-card mb-6"
      >
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search by Reference ID, message, author, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim().startsWith('FBCK-')) {
                      searchById(searchTerm.trim());
                    }
                  }}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {searchTerm.trim().startsWith('FBCK-') && (
                <Button
                  onClick={() => searchById(searchTerm.trim())}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Search size={16} className="mr-1" />
                  Find ID
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
              className={filterStatus === 'all' ? 'bg-[#f6421f]' : ''}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'replied' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('replied')}
              size="sm"
              className={filterStatus === 'replied' ? 'bg-green-500' : ''}
            >
              Replied
            </Button>
            <Button
              variant={filterStatus === 'not-replied' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('not-replied')}
              size="sm"
              className={filterStatus === 'not-replied' ? 'bg-gray-500' : ''}
            >
              Not Replied
            </Button>
          </div>

          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={fetchFeedback}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={18} />
                Refresh
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29] shadow-lg shadow-orange-300/50"
              >
                <Plus className="mr-2" size={18} />
                Create
              </Button>
            </motion.div>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <>
            {/* Search/Filter Results Count */}
            {(searchTerm.trim() || filterStatus !== 'all') && filteredFeedback.length > 0 && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredFeedback.length} of {feedbackList.length} feedback{filteredFeedback.length !== 1 ? 's' : ''}
                {searchTerm.trim() && <span className="font-medium text-[#f6421f]"> matching "{searchTerm}"</span>}
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredFeedback.map((feedback, index) => (
                <motion.div
                  key={feedback.referenceId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedFeedback(feedback)}
                  className="ysp-card bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-700 cursor-pointer hover:shadow-xl transition-all duration-300 border border-blue-100 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="bg-[#f6421f] shadow-md">{feedback.referenceId}</Badge>
                    <div className="flex gap-2">
                      {feedback.visibility === 'Public' && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 shadow-md">Public</Badge>
                      )}
                      {feedback.category && (
                        <Badge className="bg-gradient-to-r from-sky-500 to-sky-600 shadow-md">{feedback.category}</Badge>
                      )}
                      {feedback.hasReply && (
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 shadow-md">Replied</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm mb-3 line-clamp-3">{feedback.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>By {feedback.authorName}</span>
                    <span>{new Date(feedback.timestamp).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredFeedback.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No feedback found matching your filters' 
                  : 'No feedback submitted yet'}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* View Feedback Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedFeedback(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="modal-content max-w-2xl"
              style={{ willChange: 'transform, opacity' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <Badge className="bg-[#f6421f] mb-3 shadow-md">{selectedFeedback.referenceId}</Badge>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-2 flex-wrap">
                    <span>By {selectedFeedback.authorName}</span>
                    {canReply && selectedFeedback.authorIdCode && selectedFeedback.authorIdCode !== 'Guest' && (
                      <>
                        <span>•</span>
                        <span>{selectedFeedback.authorIdCode}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(selectedFeedback.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedFeedback(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Feedback Details Section - Show all metadata */}
              <div className="mb-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Category</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFeedback.category || 'Other'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                  {canReply ? (
                    <Select 
                      value={editingStatus || selectedFeedback.status || 'Pending'} 
                      onValueChange={(v: any) => setEditingStatus(v)}
                    >
                      <SelectTrigger className="mt-1 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Reviewed">Reviewed</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFeedback.status || 'Pending'}</p>
                  )}
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Visibility</span>
                  {canReply ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Switch 
                        checked={editingVisibility === 'Public'} 
                        onCheckedChange={(c) => setEditingVisibility(c ? 'Public' : 'Private')}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                        {editingVisibility === 'Public' ? <Eye size={14} /> : <EyeOff size={14} />}
                        {editingVisibility}
                      </span>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                      {selectedFeedback.visibility === 'Public' ? <Eye size={14} /> : <EyeOff size={14} />}
                      {selectedFeedback.visibility || 'Private'}
                    </p>
                  )}
                </div>
                {selectedFeedback.rating && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Rating</span>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map((i) => (
                        <Star 
                          key={i} 
                          size={16} 
                          className={i <= (selectedFeedback.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} 
                        />
                      ))}
                      <span className="ml-1 text-sm text-gray-900 dark:text-gray-100">({selectedFeedback.rating}/5)</span>
                    </div>
                  </div>
                )}
                {selectedFeedback.email && canReply && (
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Email</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFeedback.email}</p>
                  </div>
                )}
              </div>

              {/* Update Button for Admin/Auditor */}
              {canReply && (editingStatus !== selectedFeedback.status || editingVisibility !== selectedFeedback.visibility) && (
                <div className="mb-4">
                  <Button
                    onClick={async () => {
                      try {
                        setUpdatingFeedback(true);
                        console.log('[Feedback Debug] Updating feedback:', {
                          referenceId: selectedFeedback.referenceId,
                          status: editingStatus,
                          visibility: editingVisibility,
                          role: currentUser?.role
                        });
                        
                        const updatePromise = feedbackAPI.updateDetails(
                          selectedFeedback.referenceId,
                          editingStatus,
                          editingVisibility,
                          currentUser?.role
                        );
                        
                        await toast.promise(updatePromise, {
                          loading: 'Updating feedback...',
                          success: 'Feedback updated successfully! 🎉',
                          error: 'Failed to update feedback'
                        });
                        
                        const response = await updatePromise;
                        console.log('[Feedback Debug] Update response:', response);
                        
                        // Refresh feedback list
                        await fetchFeedback();
                        setSelectedFeedback(null);
                      } catch (error) {
                        console.error('[Feedback Debug] Error updating feedback:', error);
                        const errorMsg = (error instanceof Error) ? error.message : 'Unknown error';
                        toast.error(`Failed to update: ${errorMsg}`);
                      } finally {
                        setUpdatingFeedback(false);
                      }
                    }}
                    disabled={updatingFeedback}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    {updatingFeedback ? 'Updating...' : 'Save Changes'}
                  </Button>
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-[#f6421f] dark:text-[#ee8724] mb-3 flex items-center gap-2">
                  <MessageCircle size={20} />
                  Feedback Message
                </h4>
                <p className="text-justify whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-gray-900 dark:text-gray-100">
                  {selectedFeedback.message}
                </p>
                {selectedFeedback.imageUrl && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attached Image:</h5>
                    <img 
                      src={selectedFeedback.imageUrl} 
                      alt="Feedback attachment" 
                      className="max-w-full max-h-96 rounded-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:border-[#f6421f] transition-all"
                      onClick={() => window.open(selectedFeedback.imageUrl, '_blank')}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click image to view full size</p>
                  </div>
                )}
              </div>

              {selectedFeedback.hasReply && selectedFeedback.replyMessage && (
                <div className="mb-6">
                  <h4 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Reply</h4>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2 flex-wrap gap-2">
                      {canReply && selectedFeedback.replierName && selectedFeedback.replierIdCode ? (
                        <span>{selectedFeedback.replierName} ({selectedFeedback.replierIdCode})</span>
                      ) : (
                        <span>Admin Reply</span>
                      )}
                      {selectedFeedback.replyTimestamp && (
                        <span>{new Date(selectedFeedback.replyTimestamp).toLocaleDateString()}</span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{selectedFeedback.replyMessage}</p>
                  </motion.div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {canReply && !selectedFeedback.hasReply && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={() => setShowReplyModal(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      Reply
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    onClick={() => setSelectedFeedback(null)}
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

      {/* Create Feedback Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => { if (!submitting) { resetCreateForm(); setShowCreateModal(false); }}}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="modal-content max-w-2xl"
              style={{ willChange: 'transform, opacity' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-[#f6421f] dark:text-[#ee8724] flex items-center gap-2">
                  <MessageCircle size={24} />
                  Submit Feedback
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { if (!submitting) { resetCreateForm(); setShowCreateModal(false); }}}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                  disabled={submitting}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="message">Your Feedback</Label>
                  <Textarea
                    id="message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter your feedback, suggestions, or concerns..."
                    className="mt-2 min-h-[150px]"
                    disabled={submitting}
                  />
                </div>

                {/* Star Rating (required) */}
                <div>
                  <Label>Rate Your Experience (required)</Label>
                  <div className="mt-2 flex items-center gap-1">
                    {[1,2,3,4,5].map((i)=> (
                      <button
                        key={i}
                        type="button"
                        aria-label={`${i} star`}
                        onClick={()=> setNewRating(i)}
                        className="p-1"
                        disabled={submitting}
                      >
                        <Star className={i <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} size={24} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Email */}
                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={newEmail}
                    onChange={(e)=> setNewEmail(e.target.value)}
                    className="mt-2"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  {/* Native select fallback to guarantee visibility inside modal */}
                  <select
                    value={newCategory}
                    onChange={(e)=> setNewCategory(e.target.value)}
                    disabled={submitting}
                    className="mt-2 w-full h-9 rounded-md border border-input bg-input-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="Complaint">Complaint</option>
                    <option value="Suggestion">Suggestion</option>
                    <option value="Bug">Bug</option>
                    <option value="Compliment">Compliment</option>
                    <option value="Inquiry">Inquiry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {canReply && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="visibility" className="font-medium">Visibility</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{newVisibility === 'Public' ? <Eye size={16} className="inline" /> : <EyeOff size={16} className="inline" />} {newVisibility}</span>
                        <Switch 
                          id="visibility" 
                          checked={newVisibility === 'Public'} 
                          onCheckedChange={(c)=> setNewVisibility(c ? 'Public' : 'Private')} 
                          disabled={submitting} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="anonymous" className="font-medium cursor-pointer">Submit as Anonymous</Label>
                    <Switch 
                      id="anonymous" 
                      checked={newAnonymous} 
                      onCheckedChange={(c: boolean) => setNewAnonymous(c)} 
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <Label>Optional Images (Max 3, JPG/PNG only)</Label>
                  <div className="mt-2">
                    <label 
                      htmlFor="image-upload"
                      className={`
                        flex items-center justify-center gap-3 p-4 border-2 border-dashed rounded-lg
                        transition-all cursor-pointer
                        ${submitting || newImageFiles.length >= 3 
                          ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                          : 'border-[#f6421f] hover:border-[#ee8724] hover:bg-orange-50 dark:hover:bg-orange-900/10'
                        }
                      `}
                    >
                      <ImageIcon size={20} className={submitting || newImageFiles.length >= 3 ? 'text-gray-400' : 'text-[#f6421f]'} />
                      <span className={submitting || newImageFiles.length >= 3 ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}>
                        {newImageFiles.length >= 3 ? 'Maximum images reached' : `Click to add JPG/PNG images (${newImageFiles.length}/3)`}
                      </span>
                    </label>
                    {/* Use a native input fully hidden to avoid duplicate "Choose File" UI */}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      multiple
                      disabled={submitting || newImageFiles.length >= 3}
                      style={{ display: 'none' }}
                      onChange={(e)=>{
                        const files = Array.from(e.target.files || []);
                        if (files.length + newImageFiles.length > 3) {
                          toast.error('Maximum 3 images allowed');
                          return;
                        }
                        
                        // Validate file types
                        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                        const invalidFiles = files.filter(f => !allowedTypes.includes(f.type.toLowerCase()));
                        if (invalidFiles.length > 0) {
                          toast.error('Only JPG and PNG images are allowed.', {
                            duration: 4000,
                            description: `${invalidFiles.length} file(s) rejected`
                          });
                          e.target.value = '';
                          return;
                        }
                        
                        // Validate file sizes
                        const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
                        if (validFiles.length !== files.length) {
                          toast.error('Some images were too large (max 10MB each)');
                        }
                        
                        if (validFiles.length > 0) {
                          setNewImageFiles([...newImageFiles, ...validFiles]);
                          const previews = validFiles.map(f => URL.createObjectURL(f));
                          setNewImagePreviews([...newImagePreviews, ...previews]);
                        }
                        
                        // Reset input
                        e.target.value = '';
                      }} 
                    />
                  </div>
                  {newImagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {newImagePreviews.map((preview, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative group"
                        >
                          <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-[#f6421f] transition-all">
                            <img 
                              src={preview} 
                              alt={`preview ${idx + 1}`} 
                              className="w-full h-24 object-cover transition-transform group-hover:scale-110 cursor-pointer"
                              onClick={() => window.open(preview, '_blank')}
                            />
                            {/* top-right controls: always visible on mobile; fade-in on md+ */}
                            <div className="absolute top-1 right-1 flex gap-1">
                              <button
                                type="button"
                                title="Change image"
                                onClick={(e)=>{ e.stopPropagation(); handleReplaceImage(idx); }}
                                className="bg-white/90 text-gray-800 hover:bg-white rounded-full p-1 shadow md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                title="Remove image"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newFiles = newImageFiles.filter((_, i) => i !== idx);
                                  const newPreviews = newImagePreviews.filter((_, i) => i !== idx);
                                  URL.revokeObjectURL(preview);
                                  setNewImageFiles(newFiles);
                                  setNewImagePreviews(newPreviews);
                                  toast.success('Image removed');
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-center text-gray-500 truncate">
                            {newImageFiles[idx]?.name}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {/* hidden input used to replace one image */}
                  <Input
                    ref={replaceInputRef as any}
                    id="image-replace"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={onReplaceFileChange}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={handleCreateFeedback}
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29]"
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={() => { resetCreateForm(); setShowCreateModal(false); }}
                      disabled={submitting}
                      className="w-full bg-gray-500 hover:bg-gray-600"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Modal */}
      <AnimatePresence>
        {showReplyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => !submitting && setShowReplyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="modal-content max-w-2xl"
              style={{ willChange: 'transform, opacity' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-[#f6421f] dark:text-[#ee8724]">Reply to Feedback</h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => !submitting && setShowReplyModal(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                  disabled={submitting}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="reply">Your Reply</Label>
                  <Textarea
                    id="reply"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Enter your reply..."
                    className="mt-2 min-h-[150px]"
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={replyStatus} onValueChange={(v:any)=> setReplyStatus(v)}>
                      <SelectTrigger className="mt-2"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Reviewed">Reviewed</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex items-center gap-2">
                      <Switch id="replyVisibility" checked={replyVisibility === 'Public'} onCheckedChange={(c)=> setReplyVisibility(c ? 'Public' : 'Private')} />
                      <Label htmlFor="replyVisibility" className="cursor-pointer flex items-center gap-2">{replyVisibility === 'Public' ? <Eye size={16}/> : <EyeOff size={16}/>} {replyVisibility}</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={handleReply}
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      {submitting ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={() => setShowReplyModal(false)}
                      disabled={submitting}
                      className="w-full bg-gray-500 hover:bg-gray-600"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
