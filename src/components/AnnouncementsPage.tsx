/**
 * =============================================================================
 * ANNOUNCEMENTS PAGE
 * =============================================================================
 * 
 * Communication center for organization-wide announcements
 * Features:
 * - View all announcements with filters
 * - Admin can create/edit/delete announcements
 * - Priority levels (urgent, important, normal)
 * - Read/unread status
 * - Pin important announcements
 * 
 * Uses Design System Components
 * =============================================================================
 */

import { X, Plus, Pin, Edit2, Trash2, Bell, AlertCircle, Upload, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { PageLayout, Button, SearchInput, StatusChip, DESIGN_TOKENS } from "./design-system";
import CustomDropdown from "./CustomDropdown";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "urgent" | "important" | "normal";
  isPinned: boolean;
  isRead: boolean;
  author: string;
  date: string;
  category: string;
}

interface AnnouncementsPageProps {
  onClose: () => void;
  isDark: boolean;
  userRole: string;
}

export default function AnnouncementsPage({
  onClose,
  isDark,
  userRole,
}: AnnouncementsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    recipientType: "All" as "All" | "Only Heads" | "Specific Committee" | "Specific Person",
    specificRecipients: "",
    content: "",
    priority: "normal" as "urgent" | "important" | "normal",
    category: "Updates",
    isPinned: false,
  });
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "1",
      title: "Community Cleanup Drive - February 20",
      content: "Join us for our monthly community cleanup drive! Meet at Tagum City Hall at 6:00 AM. Bring gloves and enthusiasm!",
      priority: "important",
      isPinned: true,
      isRead: false,
      author: "Admin Team",
      date: "2025-02-10",
      category: "Events",
    },
    {
      id: "2",
      title: "New Member Orientation Schedule",
      content: "New member orientation will be held every Saturday at 2:00 PM. Please bring valid ID and membership form.",
      priority: "normal",
      isPinned: true,
      isRead: true,
      author: "Membership Committee",
      date: "2025-02-08",
      category: "Training",
    },
    {
      id: "3",
      title: "URGENT: Change in Meeting Schedule",
      content: "This week's general assembly has been moved to Thursday, 6:00 PM due to venue conflicts. Please inform your co-members.",
      priority: "urgent",
      isPinned: false,
      isRead: false,
      author: "Admin Team",
      date: "2025-02-15",
      category: "Updates",
    },
    {
      id: "4",
      title: "Scholarship Program Applications Open",
      content: "Applications for our scholarship program are now open! Deadline is March 15. Visit our office for forms.",
      priority: "important",
      isPinned: false,
      isRead: true,
      author: "Education Committee",
      date: "2025-02-05",
      category: "Programs",
    },
  ]);

  const categories = ["all", "Events", "Training", "Updates", "Programs"];

  const filteredAnnouncements = announcements
    .filter((ann) => {
      const matchesSearch =
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || ann.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Unread before read
      if (!a.isRead && b.isRead) return -1;
      if (a.isRead && !b.isRead) return 1;
      // Then by date
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handleMarkAsRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((ann) => (ann.id === id ? { ...ann, isRead: true } : ann))
    );
  };

  const handleTogglePin = (id: string) => {
    if (userRole !== "admin") {
      toast.error("Only admins can pin announcements");
      return;
    }
    setAnnouncements((prev) =>
      prev.map((ann) =>
        ann.id === id ? { ...ann, isPinned: !ann.isPinned } : ann
      )
    );
    toast.success("Announcement pin status updated");
  };

  const handleDelete = (id: string) => {
    if (userRole !== "admin") {
      toast.error("Only admins can delete announcements");
      return;
    }
    setAnnouncements((prev) => prev.filter((ann) => ann.id !== id));
    toast.success("Announcement deleted");
  };

  const handleEdit = (announcement: Announcement) => {
    if (userRole !== "admin") {
      toast.error("Only admins can edit announcements");
      return;
    }
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      subject: "",
      recipientType: "All",
      specificRecipients: "",
      content: announcement.content,
      priority: announcement.priority,
      category: announcement.category,
      isPinned: announcement.isPinned,
    });
    setUploadedImages([]);
    setShowCreateModal(true);
  };

  const handleCreateNew = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      subject: "",
      recipientType: "All",
      specificRecipients: "",
      content: "",
      priority: "normal",
      category: "Updates",
      isPinned: false,
    });
    setUploadedImages([]);
    setShowCreateModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (uploadedImages.length + files.length > 5) {
      toast.error('Maximum 5 images allowed', {
        description: 'You can only upload up to 5 images per announcement'
      });
      return;
    }

    const validFiles: Array<{ file: File; preview: string }> = [];
    
    for (const file of files) {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        toast.error('Invalid file type', {
          description: `${file.name} is not a .jpg or .png file`
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large', {
          description: `${file.name} exceeds 5MB limit`
        });
        continue;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        validFiles.push({ file, preview: reader.result as string });
        if (validFiles.length === files.length || validFiles.length + uploadedImages.length >= 5) {
          setUploadedImages([...uploadedImages, ...validFiles].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Body content is required");
      return;
    }
    if ((formData.recipientType === "Specific Committee" || formData.recipientType === "Specific Person") && !formData.specificRecipients.trim()) {
      toast.error("Please specify recipients");
      return;
    }

    const recipientInfo = formData.recipientType === "All" 
      ? "All Members" 
      : formData.recipientType === "Only Heads"
      ? "All Heads"
      : `${formData.recipientType}: ${formData.specificRecipients}`;

    if (editingAnnouncement) {
      // Update existing announcement
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann.id === editingAnnouncement.id
            ? {
                ...ann,
                title: `${formData.title} - ${formData.subject}`,
                content: `${formData.content}\n\n📢 Recipient: ${recipientInfo}`,
                priority: formData.priority,
                category: formData.category,
                isPinned: formData.isPinned,
              }
            : ann
        )
      );
      toast.success("Announcement updated successfully");
    } else {
      // Create new announcement
      const newAnnouncement: Announcement = {
        id: `ANN-${Date.now()}`,
        title: `${formData.title} - ${formData.subject}`,
        content: `${formData.content}\n\n📢 Recipient: ${recipientInfo}${uploadedImages.length > 0 ? `\n📷 ${uploadedImages.length} image(s) attached` : ''}`,
        priority: formData.priority,
        category: formData.category,
        isPinned: formData.isPinned,
        isRead: false,
        author: "Admin Team",
        date: new Date().toISOString().split("T")[0],
      };
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      toast.success("Announcement created successfully");
    }

    setShowCreateModal(false);
    setEditingAnnouncement(null);
    setUploadedImages([]);
    setFormData({
      title: "",
      subject: "",
      recipientType: "All",
      specificRecipients: "",
      content: "",
      priority: "normal",
      category: "Updates",
      isPinned: false,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return DESIGN_TOKENS.colors.status.error;
      case "important":
        return DESIGN_TOKENS.colors.brand.orange;
      default:
        return DESIGN_TOKENS.colors.status.success;
    }
  };

  return (
    <PageLayout
      title="Announcements"
      subtitle="Stay updated with the latest news and information"
      isDark={isDark}
      onClose={onClose}
      breadcrumbs={[
        { label: "Home", onClick: onClose },
        { label: "Communication Center", onClick: undefined },
        { label: "Announcements", onClick: undefined },
      ]}
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search announcements..."
            isDark={isDark}
          />
        </div>
        {userRole === "admin" && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Announcement
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-[#f6421f] text-white"
                : "bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10"
            }`}
            style={{
              fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
              transitionDuration: `${DESIGN_TOKENS.motion.duration.fast}ms`,
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p
              style={{
                fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                color: isDark ? "#9ca3af" : "#6b7280",
              }}
            >
              No announcements found
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`p-6 rounded-xl border transition-all ${
                !announcement.isRead
                  ? "border-[#f6421f]/30 bg-[#f6421f]/5"
                  : "border-white/20 dark:border-white/10"
              }`}
              style={{
                background: announcement.isRead
                  ? isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(255, 255, 255, 0.7)"
                  : undefined,
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.isPinned && (
                      <Pin className="w-4 h-4 text-[#f6421f]" />
                    )}
                    {!announcement.isRead && (
                      <span className="w-2 h-2 bg-[#f6421f] rounded-full" />
                    )}
                    <h3
                      style={{
                        fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                        fontSize: `${DESIGN_TOKENS.typography.fontSize.h4}px`,
                        fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                      }}
                    >
                      {announcement.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusChip
                      status={announcement.priority}
                      label={announcement.priority.toUpperCase()}
                      customColor={getPriorityColor(announcement.priority)}
                    />
                    <span
                      className="px-2 py-1 rounded-lg"
                      style={{
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.05)",
                        fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                        fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                      }}
                    >
                      {announcement.category}
                    </span>
                  </div>
                </div>
                {userRole === "admin" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTogglePin(announcement.id)}
                      className={`p-2 rounded-lg transition-all ${
                        announcement.isPinned
                          ? "bg-[#f6421f] text-white"
                          : "hover:bg-white/50 dark:hover:bg-white/10"
                      }`}
                      aria-label="Toggle pin"
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-all"
                      aria-label="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-all"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <p
                className="mb-4"
                style={{
                  fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                  lineHeight: 1.6,
                }}
              >
                {announcement.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
                <div
                  style={{
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  By {announcement.author} • {announcement.date}
                </div>
                {!announcement.isRead && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMarkAsRead(announcement.id)}
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="max-w-2xl w-full rounded-2xl border p-8 my-8"
            style={{
              background: isDark
                ? "rgba(17, 24, 39, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2
                style={{
                  fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                  fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                  color: DESIGN_TOKENS.colors.brand.red,
                }}
              >
                {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title"
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
                  style={{
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                  }}
                />
              </div>

              {/* Content */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter announcement content"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none resize-none"
                  style={{
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                  }}
                />
              </div>

              {/* Priority and Category */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label
                    className="block mb-2"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as "urgent" | "important" | "normal" })}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
                    style={{
                      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                    }}
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label
                    className="block mb-2"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
                    style={{
                      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pin Announcement */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20"
                />
                <label
                  htmlFor="isPinned"
                  className="cursor-pointer"
                  style={{
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                  }}
                >
                  <Pin className="w-4 h-4 inline mr-2" />
                  Pin this announcement to the top
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                style={{
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 rounded-xl text-white transition-colors"
                style={{
                  background: "linear-gradient(135deg, #f6421f 0%, #ee8724 100%)",
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                }}
              >
                {editingAnnouncement ? "Save Changes" : "Create Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
