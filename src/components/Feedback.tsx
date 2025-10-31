import { useState, useEffect } from 'react';
import { Search, Plus, X, MessageCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { feedbackAPI, type Feedback as FeedbackType } from '../services/api';
import { CardSkeleton } from './ui/skeletons';

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
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canReply = currentUser && ['Admin', 'Auditor'].includes(currentUser.role);
  const isGuest = currentUser && currentUser.role === 'Guest';

  // Fetch feedback on mount
  useEffect(() => {
    fetchFeedback();
  }, [currentUser]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      
      const idCode = currentUser?.id || currentUser?.idCode || 'guest';
      const name = currentUser?.name || currentUser?.firstName || 'Guest';
      const role = currentUser?.role || 'Guest';
      
  const response = await feedbackAPI.getAll(idCode, name, role);
      
      if (response.success && Array.isArray(response.feedback)) {
        setFeedbackList(response.feedback);
      } else {
        console.error('Failed to fetch feedback:', response.message);
        toast.error('Failed to load feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback', {
        action: { label: 'Retry', onClick: fetchFeedback },
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter feedback based on search and status
  const filteredFeedback = feedbackList.filter(f => {
    const matchesSearch = searchTerm
      ? f.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.message.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'replied' ? f.hasReply :
      !f.hasReply;

    return matchesSearch && matchesFilter;
  });

  const handleCreateFeedback = async () => {
    if (!newMessage.trim()) {
      toast.error('Please enter your feedback message');
      return;
    }

    try {
      setSubmitting(true);
      const controller = new AbortController();
      const toastId = toast.loading('Submitting feedback…', {
        duration: Infinity,
        action: {
          label: 'Cancel',
          onClick: () => controller.abort(),
        },
      });

      const response = await feedbackAPI.create({
        message: newMessage.trim(),
        authorName: currentUser?.name || currentUser?.firstName || 'Guest',
        authorIdCode: isGuest ? undefined : (currentUser?.id || currentUser?.idCode),
      }, { signal: controller.signal, timeoutMs: 30000 });

      if (response.success && response.feedback) {
        toast.success('Feedback submitted successfully', { id: toastId });
        const newFeedback = Array.isArray(response.feedback) ? response.feedback[0] : response.feedback;
        toast.info(`Reference: ${newFeedback.referenceId}`, { duration: 3000 });

        setNewMessage('');
        setShowCreateModal(false);
        await fetchFeedback();
      } else {
        toast.error(response.message || 'Failed to submit feedback', {
          id: toastId,
          action: { label: 'Retry', onClick: handleCreateFeedback },
        });
      }
    } catch (error: any) {
      console.error('Error creating feedback:', error);
      if (error?.name === 'AbortError') {
        toast.info('Canceled', { description: 'Feedback submission canceled' });
      } else {
        toast.error('Failed to submit feedback', { action: { label: 'Retry', onClick: handleCreateFeedback } });
      }
    } finally {
      setSubmitting(false);
    }
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
      const controller = new AbortController();
      const toastId = toast.loading('Sending reply…', {
        duration: Infinity,
        action: { label: 'Cancel', onClick: () => controller.abort() },
      });

      const response = await feedbackAPI.reply({
        referenceId: selectedFeedback.referenceId,
        reply: replyMessage.trim(),
        replierName: currentUser?.name || currentUser?.firstName || 'Admin',
        replierIdCode: currentUser?.id || currentUser?.idCode || '',
        replierRole: currentUser?.role || 'Admin',
      }, { signal: controller.signal, timeoutMs: 30000 });

      if (response.success) {
        toast.success('Reply sent successfully', { id: toastId });
        setReplyMessage('');
        setShowReplyModal(false);
        await fetchFeedback();
        setSelectedFeedback(null);
      } else {
        toast.error(response.message || 'Failed to send reply', {
          id: toastId,
          action: { label: 'Retry', onClick: handleReply },
        });
      }
    } catch (error: any) {
      console.error('Error replying to feedback:', error);
      if (error?.name === 'AbortError') {
        toast.info('Canceled', { description: 'Reply canceled' });
      } else {
        toast.error('Failed to send reply', { action: { label: 'Retry', onClick: handleReply } });
      }
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
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-6">
          {/* Search - full width on mobile */}
          <div className="w-full md:flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by Reference ID or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {/* Filters + Actions - stacked on mobile for visibility */}
          <div className="w-full flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto md:overflow-visible py-1 -mx-1 px-1 w-full">
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

            <div className="flex gap-2 w-full md:w-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={fetchFeedback}
                  variant="outline"
                  disabled={loading}
                  className="flex-1 md:flex-none"
                >
                  <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={18} />
                  <span className="ml-2">Refresh</span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29] shadow-lg shadow-orange-300/50 flex-1 md:flex-none"
                >
                  <Plus className="mr-2" size={18} />
                  Create
                </Button>
              </motion.div>
            </div>
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
                    {feedback.hasReply && (
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 shadow-md">Replied</Badge>
                    )}
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

              <div className="mb-6">
                <h4 className="text-[#f6421f] dark:text-[#ee8724] mb-3 flex items-center gap-2">
                  <MessageCircle size={20} />
                  Feedback Message
                </h4>
                <p className="text-justify whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {selectedFeedback.message}
                </p>
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
            onClick={() => !submitting && setShowCreateModal(false)}
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
                  onClick={() => !submitting && setShowCreateModal(false)}
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
                      onClick={() => setShowCreateModal(false)}
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
