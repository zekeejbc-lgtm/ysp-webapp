/**
 * =============================================================================
 * POLLING & EVALUATIONS PAGE (Comprehensive Google Forms Style)
 * =============================================================================
 * 
 * Complete polling system with:
 * - Public/Private polls
 * - Category filters
 * - Status filters
 * - Search functionality
 * - Poll cards with actions
 * - Create poll button (admin/heads/officers/auditors)
 * 
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { 
  Search, Plus, BarChart3, Star, FileText, CheckSquare, Calendar,
  Eye, Edit, Trash2, Copy, Link2, Users, Clock, Globe, Lock,
  TrendingUp, Download, Share2, Play, Pause, RotateCcw, User
} from "lucide-react";
import { toast } from "sonner";
import { PageLayout, Button, DESIGN_TOKENS } from "./design-system";
import type { Poll, PollType, PollStatus, Visibility } from "./polling/types";
import CreatePollModal from "./polling/CreatePollModal";
import TakePollModalEnhanced from "./polling/TakePollModalEnhanced";
import PollResultsModal from "./polling/PollResultsModal";
import CustomDropdown from "./CustomDropdown";
import { getPollsFromGAS, createPollInGAS, submitPollResponseInGAS, deletePollInGAS, updatePollStatusInGAS } from "../services/gasApi";

interface PollingEvaluationsPageProps {
  onClose: () => void;
  isDark: boolean;
  userRole: string;
  isLoggedIn?: boolean;
  userIdCode?: string;
  userName?: string;
  userCommittee?: string;
  userPosition?: string;
}

export default function PollingEvaluationsPage({ 
  onClose, 
  isDark, 
  userRole,
  isLoggedIn = true,
  userIdCode = "",
  userName = "",
  userCommittee = "",
  userPosition = ""
}: PollingEvaluationsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PollType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PollStatus | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | "all">("all");
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTakePollModal, setShowTakePollModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  // Check if user can create polls
  const canCreatePolls = ["admin", "head", "officer", "auditor"].includes(userRole.toLowerCase());

  // Polls data
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    setIsLoading(true);
    try {
      const result = await getPollsFromGAS(userRole, userIdCode, userCommittee);
      if (result.success) {
        setPolls(result.polls);
      } else {
        toast.error("Failed to load polls");
      }
    } catch (error) {
      console.error("Error loading polls:", error);
      toast.error("Error loading polls");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter polls
  const filteredPolls = polls.filter((poll) => {
    // For guests, only show public polls
    if (!isLoggedIn && poll.visibility === "private") {
      return false;
    }

    // Search filter
    const matchesSearch = 
      poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poll.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poll.createdBy.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = categoryFilter === "all" || poll.type === categoryFilter;

    // Status filter
    const matchesStatus = statusFilter === "all" || poll.status === statusFilter;

    // Visibility filter
    const matchesVisibility = visibilityFilter === "all" || poll.visibility === visibilityFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesVisibility;
  });

  // Category options
  const categories = [
    { value: "all", label: "All", icon: <BarChart3 className="w-4 h-4" /> },
    { value: "poll", label: "Polls", icon: <BarChart3 className="w-4 h-4" /> },
    { value: "evaluation", label: "Evaluations", icon: <Star className="w-4 h-4" /> },
    { value: "survey", label: "Surveys", icon: <CheckSquare className="w-4 h-4" /> },
    { value: "assessment", label: "Assessments", icon: <FileText className="w-4 h-4" /> },
    { value: "form", label: "Forms", icon: <Calendar className="w-4 h-4" /> },
  ];

  // Handle actions
  const handleTakePoll = (poll: Poll) => {
    setSelectedPoll(poll);
    setShowTakePollModal(true);
  };

  const handleViewResults = (poll: Poll) => {
    setSelectedPoll(poll);
    setShowResultsModal(true);
  };

  const handleEditPoll = (poll: Poll) => {
    toast.info("Edit functionality coming soon!");
  };

  const handleClosePoll = async (pollId: string) => {
    const result = await updatePollStatusInGAS(pollId, "closed");
    if (result.success) {
      setPolls(polls.map(p => p.id === pollId ? { ...p, status: "closed" as PollStatus } : p));
      toast.success("Poll closed successfully");
    } else {
      toast.error("Failed to close poll");
    }
  };

  const handleReopenPoll = async (pollId: string) => {
    const result = await updatePollStatusInGAS(pollId, "open");
    if (result.success) {
      setPolls(polls.map(p => p.id === pollId ? { ...p, status: "open" as PollStatus } : p));
      toast.success("Poll reopened successfully");
    } else {
      toast.error("Failed to reopen poll");
    }
  };

  const handleDuplicatePoll = (poll: Poll) => {
    const newPoll = {
      ...poll,
      id: `${poll.type.toUpperCase()}-${polls.length + 1}`,
      title: `${poll.title} (Copy)`,
      status: "draft" as PollStatus,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      responses: 0,
      views: 0,
    };
    // Note: Duplication in GAS not implemented yet, just local for now or we could implement createPollInGAS here too
    // For now, let's just open the create modal with pre-filled data? 
    // Or just create it directly. Let's create it directly.
    createPollInGAS(newPoll, userIdCode, userName).then(result => {
        if (result.success) {
            setPolls([...polls, newPoll]);
            toast.success("Poll duplicated successfully");
            loadPolls();
        } else {
            toast.error("Failed to duplicate poll");
        }
    });
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;
    
    const result = await deletePollInGAS(pollId);
    if (result.success) {
      setPolls(polls.filter(p => p.id !== pollId));
      toast.success("Poll deleted successfully");
    } else {
      toast.error("Failed to delete poll");
    }
  };

  const handleSharePoll = (poll: Poll) => {
    if (poll.shareLink) {
      navigator.clipboard.writeText(poll.shareLink);
      toast.success("Share link copied to clipboard!");
    }
  };

  const getTypeIcon = (type: PollType) => {
    switch (type) {
      case "poll": return <BarChart3 className="w-5 h-5" />;
      case "evaluation": return <Star className="w-5 h-5" />;
      case "survey": return <CheckSquare className="w-5 h-5" />;
      case "assessment": return <FileText className="w-5 h-5" />;
      case "form": return <Calendar className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: PollStatus) => {
    switch (status) {
      case "open": return { bg: "#10b98120", color: "#10b981" };
      case "closed": return { bg: "#6b728020", color: "#6b7280" };
      case "draft": return { bg: "#f6421f20", color: "#f6421f" };
    }
  };

  return (
    <PageLayout
      title={isLoggedIn ? "Polling & Evaluations" : "Public Polls"}
      subtitle={isLoggedIn ? "Create polls, gather feedback, and analyze results" : "Participate in open polls and surveys"}
      isDark={isDark}
      onClose={onClose}
      breadcrumbs={[
        { label: "Home", onClick: onClose },
        { label: isLoggedIn ? "Communication Center" : "Public", onClick: undefined },
        { label: isLoggedIn ? "Polling & Evaluations" : "Polls", onClick: undefined },
      ]}
      actions={
        canCreatePolls ? (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-5 h-5" />}
          >
            Create Poll
          </Button>
        ) : null
      }
    >
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search polls by title, description, or creator..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
            style={{
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value as any)}
              className={`px-4 py-2 rounded-full text-sm transition-all flex items-center gap-2 ${
                categoryFilter === cat.value
                  ? "bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
              style={{
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              }}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status and Visibility Filters */}
        <div className="flex flex-wrap gap-3">
          <CustomDropdown
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as any)}
            options={[
              { value: "all", label: "All Status" },
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
              { value: "draft", label: "Draft" },
            ]}
            isDark={isDark}
            size="md"
            className="min-w-[150px]"
          />

          {isLoggedIn && (
            <CustomDropdown
              value={visibilityFilter}
              onChange={(value) => setVisibilityFilter(value as any)}
              options={[
                { value: "all", label: "All Polls" },
                { value: "public", label: "Public Only" },
                { value: "private", label: "Private Only" },
              ]}
              isDark={isDark}
              size="md"
              className="min-w-[150px]"
            />
          )}
        </div>
      </div>

      {/* Stats Overview (for logged in users) */}
      {isLoggedIn && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            className="rounded-xl p-4 border"
            style={{
              background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(20px)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Play className="w-4 h-4 text-[#10b981]" />
              <span className="text-xs text-muted-foreground">Open Polls</span>
            </div>
            <p className="text-2xl" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.bold, color: "#10b981" }}>
              {polls.filter(p => p.status === "open").length}
            </p>
          </div>

          <div
            className="rounded-xl p-4 border"
            style={{
              background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(20px)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[#f6421f]" />
              <span className="text-xs text-muted-foreground">Total Responses</span>
            </div>
            <p className="text-2xl" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.bold, color: DESIGN_TOKENS.colors.brand.red }}>
              {polls.reduce((sum, p) => sum + p.responses, 0)}
            </p>
          </div>

          <div
            className="rounded-xl p-4 border"
            style={{
              background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(20px)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-xs text-muted-foreground">Public Polls</span>
            </div>
            <p className="text-2xl" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.bold, color: "#3b82f6" }}>
              {polls.filter(p => p.visibility === "public").length}
            </p>
          </div>

          <div
            className="rounded-xl p-4 border"
            style={{
              background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(20px)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#ee8724]" />
              <span className="text-xs text-muted-foreground">Avg Response Rate</span>
            </div>
            <p className="text-2xl" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.bold, color: DESIGN_TOKENS.colors.brand.orange }}>
              72%
            </p>
          </div>
        </div>
      )}

      {/* Poll Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPolls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            isDark={isDark}
            isLoggedIn={isLoggedIn}
            userRole={userRole}
            canCreatePolls={canCreatePolls}
            onTakePoll={handleTakePoll}
            onViewResults={handleViewResults}
            onEdit={handleEditPoll}
            onClose={handleClosePoll}
            onReopen={handleReopenPoll}
            onDuplicate={handleDuplicatePoll}
            onDelete={handleDeletePoll}
            onShare={handleSharePoll}
            getTypeIcon={getTypeIcon}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredPolls.length === 0 && (
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl mb-2" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}>
            No polls found
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery ? "Try adjusting your search or filters" : "No polls available at the moment"}
          </p>
          {canCreatePolls && (
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-5 h-5" />}
            >
              Create Your First Poll
            </Button>
          )}
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreateModal && (
        <CreatePollModal
          isDark={isDark}
          userRole={userRole}
          onClose={() => setShowCreateModal(false)}
          onSave={async (newPoll) => {
            const result = await createPollInGAS(newPoll, userIdCode, userName);
            if (result.success) {
              setPolls([...polls, newPoll]);
              setShowCreateModal(false);
              toast.success("Poll created successfully!");
              loadPolls();
            } else {
              toast.error("Failed to create poll: " + result.message);
            }
          }}
        />
      )}

      {/* Take Poll Modal */}
      {showTakePollModal && selectedPoll && (
        <TakePollModalEnhanced
          poll={selectedPoll}
          isDark={isDark}
          isLoggedIn={isLoggedIn}
          onClose={() => {
            setShowTakePollModal(false);
            setSelectedPoll(null);
          }}
          onSubmit={async (responses) => {
            const result = await submitPollResponseInGAS(
              selectedPoll.id, 
              responses, 
              userIdCode, 
              userName, 
              userPosition, 
              userCommittee
            );
            
            if (result.success) {
              // Update response count locally
              setPolls(polls.map(p => 
                p.id === selectedPoll.id ? { ...p, responses: p.responses + 1 } : p
              ));
              setShowTakePollModal(false);
              setSelectedPoll(null);
              toast.success("Response submitted successfully!");
            } else {
              toast.error("Failed to submit response: " + result.message);
            }
          }}
        />
      )}

      {/* Results Modal */}
      {showResultsModal && selectedPoll && (
        <PollResultsModal
          poll={selectedPoll}
          isDark={isDark}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedPoll(null);
          }}
        />
      )}
    </PageLayout>
  );
}

// Poll Card Component
interface PollCardProps {
  poll: Poll;
  isDark: boolean;
  isLoggedIn: boolean;
  userRole: string;
  canCreatePolls: boolean;
  onTakePoll: (poll: Poll) => void;
  onViewResults: (poll: Poll) => void;
  onEdit: (poll: Poll) => void;
  onClose: (pollId: string) => void;
  onReopen: (pollId: string) => void;
  onDuplicate: (poll: Poll) => void;
  onDelete: (pollId: string) => void;
  onShare: (poll: Poll) => void;
  getTypeIcon: (type: PollType) => JSX.Element;
  getStatusColor: (status: PollStatus) => { bg: string; color: string };
}

function PollCard({
  poll,
  isDark,
  isLoggedIn,
  userRole,
  canCreatePolls,
  onTakePoll,
  onViewResults,
  onEdit,
  onClose,
  onReopen,
  onDuplicate,
  onDelete,
  onShare,
  getTypeIcon,
  getStatusColor,
}: PollCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="rounded-xl p-6 border hover:shadow-lg transition-all relative"
      style={{
        background: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(20px)",
        borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Theme Header Bar */}
      {poll.theme.headerImage && (
        <div 
          className="absolute top-0 left-0 right-0 h-2 rounded-t-xl"
          style={{ backgroundColor: poll.theme.primaryColor }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getTypeIcon(poll.type)}
          <span
            className="px-2 py-1 rounded-full text-xs"
            style={{
              backgroundColor: getStatusColor(poll.status).bg,
              color: getStatusColor(poll.status).color,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
            }}
          >
            {poll.status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {poll.visibility === "public" ? (
            <Globe className="w-4 h-4 text-blue-500" title="Public" />
          ) : (
            <Lock className="w-4 h-4 text-gray-500" title="Private" />
          )}
          <span className="text-xs text-muted-foreground capitalize">{poll.type}</span>
        </div>
      </div>

      {/* Title & Description */}
      <h4
        className="mb-2 line-clamp-2"
        style={{
          fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
          fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
          fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
          color: poll.theme.primaryColor,
        }}
      >
        {poll.title}
      </h4>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {poll.description}
      </p>

      {/* Meta Info */}
      <div className="space-y-1 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3" />
          <span>{poll.responses} responses • {poll.views} views</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-3 h-3" />
          <span>By {poll.createdBy} ({poll.createdByRole})</span>
        </div>
        {!poll.openForever && poll.deadline && (
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Closes {new Date(poll.deadline).toLocaleDateString()}</span>
          </div>
        )}
        {poll.openForever && (
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Open Forever</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* Member Actions */}
        {poll.status === "open" && (
          <button
            onClick={() => onTakePoll(poll)}
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white hover:shadow-lg transition-all text-sm"
            style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
          >
            Take Poll
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onViewResults(poll)}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-xs flex items-center justify-center gap-1"
            style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
          >
            <Eye className="w-3 h-3" />
            Results
          </button>

          {poll.visibility === "public" && (
            <button
              onClick={() => onShare(poll)}
              className="flex-1 px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all text-xs flex items-center justify-center gap-1"
            >
              <Share2 className="w-3 h-3" />
              Share
            </button>
          )}
        </div>

        {/* Admin Actions */}
        {canCreatePolls && showActions && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}>
            <button
              onClick={() => onEdit(poll)}
              className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all flex items-center justify-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>

            {poll.status === "open" ? (
              <button
                onClick={() => onClose(poll.id)}
                className="px-2 py-1 rounded text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-all flex items-center justify-center gap-1"
              >
                <Pause className="w-3 h-3" />
                Close
              </button>
            ) : (
              <button
                onClick={() => onReopen(poll.id)}
                className="px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-all flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reopen
              </button>
            )}

            <button
              onClick={() => onDuplicate(poll)}
              className="px-2 py-1 rounded text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition-all flex items-center justify-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Duplicate
            </button>

            <button
              onClick={() => onDelete(poll.id)}
              className="px-2 py-1 rounded text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-all flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Missing User import
import { User } from "lucide-react";