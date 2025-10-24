import React, { useState } from 'react';
import { Search, Plus, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';

interface FeedbackProps {
  darkMode: boolean;
  currentUser: any;
}

export default function Feedback({ darkMode, currentUser }: FeedbackProps) {
  const [feedbackList, setFeedbackList] = useState([
    {
      id: 1,
      refNumber: 'YSPTFB-0001',
      idCode: 'YSP-004',
      author: 'Ana Garcia',
      message: 'I would like to suggest more frequent training sessions for members, especially on leadership and project management skills. This would help us become more effective in our roles.',
      date: '2024-10-10',
      replies: [
        {
          author: 'Juan Dela Cruz (Admin)',
          message: 'Thank you for your suggestion! We are planning to conduct quarterly training sessions starting next month. Please watch out for the announcement.',
          date: '2024-10-12'
        }
      ]
    },
    {
      id: 2,
      refNumber: 'YSPTFB-0002',
      idCode: 'YSP-005',
      author: 'Carlos Martinez',
      message: 'The recent community clean-up drive was very well organized. However, I noticed we ran out of cleaning materials midway. Perhaps we could improve our logistics planning for future events.',
      date: '2024-10-11',
      replies: [
        {
          author: 'Pedro Reyes (Auditor)',
          message: 'Thank you for bringing this to our attention. We will work with the Logistics Committee to improve our inventory management and pre-event planning.',
          date: '2024-10-13'
        }
      ]
    },
    {
      id: 3,
      refNumber: 'YSPTFB-0003',
      idCode: 'YSP-004',
      author: 'Ana Garcia',
      message: 'Could we have more flexible meeting times? Some members have difficulty attending due to work or school schedules.',
      date: '2024-10-14',
      replies: []
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<typeof feedbackList[0] | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  const canReply = currentUser && ['Admin', 'Auditor'].includes(currentUser.role);

  // Filter feedback based on role
  const filteredFeedback = feedbackList.filter(f => {
    const matchesSearch = searchTerm
      ? f.refNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.message.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    // Members see only their own feedback
    const matchesUser = canReply ? true : f.idCode === currentUser.idCode;

    return matchesSearch && matchesUser;
  });

  const handleCreateFeedback = () => {
    if (!newMessage.trim()) {
      toast.error('Please enter your feedback message');
      return;
    }

    const newFeedback = {
      id: feedbackList.length + 1,
      refNumber: `YSPTFB-${String(feedbackList.length + 1).padStart(4, '0')}`,
      idCode: currentUser.idCode,
      author: currentUser.fullName,
      message: newMessage,
      date: new Date().toISOString().split('T')[0],
      replies: []
    };

    setFeedbackList([newFeedback, ...feedbackList]);
    
    toast.success('Feedback submitted successfully', {
      description: `Reference Number: ${newFeedback.refNumber}`
    });

    setNewMessage('');
    setShowCreateModal(false);
  };

  const handleReply = () => {
    if (!replyMessage.trim() || !selectedFeedback) {
      toast.error('Please enter your reply');
      return;
    }

    const updatedFeedback = feedbackList.map(f => {
      if (f.id === selectedFeedback.id) {
        return {
          ...f,
          replies: [
            ...f.replies,
            {
              author: `${currentUser.fullName} (${currentUser.role})`,
              message: replyMessage,
              date: new Date().toISOString().split('T')[0]
            }
          ]
        };
      }
      return f;
    });

    setFeedbackList(updatedFeedback);
    
    toast.success('Reply sent successfully');

    setReplyMessage('');
    setShowReplyModal(false);
    setSelectedFeedback(updatedFeedback.find(f => f.id === selectedFeedback.id) || null);
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
              placeholder="Search feedback..."
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
              Create
            </Button>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredFeedback.map((feedback, index) => (
            <motion.div
              key={feedback.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedFeedback(feedback)}
              className="ysp-card bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-700 cursor-pointer hover:shadow-xl transition-all duration-300 border border-blue-100 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-3">
                <Badge className="bg-[#f6421f] shadow-md">{feedback.refNumber}</Badge>
                {feedback.replies.length > 0 && (
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 shadow-md">Replied</Badge>
                )}
              </div>
              <p className="text-sm mb-3 line-clamp-3">{feedback.message}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>By {feedback.author}</span>
                <span>{feedback.date}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredFeedback.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No feedback found
          </div>
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="modal-content max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <Badge className="bg-[#f6421f] mb-3 shadow-md">{selectedFeedback.refNumber}</Badge>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                    <span>By {selectedFeedback.author}</span>
                    <span>•</span>
                    <span>{selectedFeedback.date}</span>
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

              {selectedFeedback.replies.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[#f6421f] dark:text-[#ee8724] mb-3">Replies ({selectedFeedback.replies.length})</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedFeedback.replies.map((reply, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                          <span>{reply.author}</span>
                          <span>{reply.date}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{reply.message}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {canReply && (
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
                <h3 className="text-[#f6421f] dark:text-[#ee8724] flex items-center gap-2">
                  <MessageCircle size={24} />
                  Submit Feedback
                </h3>
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
                  <Label htmlFor="message">Your Feedback</Label>
                  <Textarea
                    id="message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter your feedback, suggestions, or concerns..."
                    className="mt-2 min-h-[150px]"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={handleCreateFeedback}
                      className="w-full bg-gradient-to-r from-[#f6421f] to-[#ee8724] hover:from-[#ee8724] hover:to-[#fbcb29]"
                    >
                      Submit Feedback
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
            onClick={() => setShowReplyModal(false)}
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
                <h3 className="text-[#f6421f] dark:text-[#ee8724]">Reply to Feedback</h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowReplyModal(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
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
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={handleReply}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      Send Reply
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={() => setShowReplyModal(false)}
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
