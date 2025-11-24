/**
 * =============================================================================
 * MANAGE MEMBERS PAGE
 * =============================================================================
 * 
 * Admin page for managing YSP members and pending applications
 * Features:
 * - Member table with search and filters
 * - Total population stats
 * - Pending applications modal
 * - Resume-style application viewer
 * - Approve/Reject/Email actions
 * 
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { Search, UserPlus, Download, Filter, Eye, Edit, Trash2, Mail, FileText, CheckCircle, XCircle, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { PageLayout, Button, DESIGN_TOKENS, getGlassStyle } from "./design-system";
import { AddMemberModal, EditMemberModal, ViewMemberModal } from "./ManageMembersModals";
import CustomDropdown from "./CustomDropdown";

interface Member {
  id: string;
  name: string;
  position: string;
  role: string;
  committee: string;
  status: "Active" | "Inactive" | "Suspended";
  email: string;
  phone: string;
  dateJoined: string;
  // Extended info for view modal
  address?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  civilStatus?: string;
  nationality?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodType?: string;
  medicalConditions?: string;
}

interface PendingApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateApplied: string;
  committee: string;
  status: "pending" | "approved" | "rejected";
  // Full application data
  fullData: ApplicationData;
}

interface ApplicationData {
  // Basic Info
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  civilStatus: string;
  nationality: string;

  // YSP Info
  chapter: string;
  committeePreference: string;
  desiredRole: string;

  // Additional Info (dynamic)
  skills?: string;
  education?: string;
  certifications?: string;
  experience?: string;
  achievements?: string;
  volunteerHistory?: string;
  reasonForJoining?: string;
  personalStatement?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactNumber?: string;

  // Social Media
  facebook?: string;
  instagram?: string;
  twitter?: string;

  // Attachments
  attachments?: {
    type: string;
    name: string;
    url: string;
  }[];

  // Profile Picture
  profilePicture?: string;
}

interface ManageMembersPageProps {
  onClose: () => void;
  isDark: boolean;
}

export default function ManageMembersPage({ onClose, isDark }: ManageMembersPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterCommittee, setFilterCommittee] = useState("all");
  const [showPendingsModal, setShowPendingsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<PendingApplication | null>(null);

  // New states for Add, Edit, View
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showViewMemberModal, setShowViewMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);

  // Helper to infer committee from ID
  const getCommitteeFromId = (id: string) => {
    if (!id) return 'N/A';
    const prefix = id.split('-')[0];
    const mapping: Record<string, string> = {
      'YSPTIR': 'Membership and Internal Affairs Committee',
      'YSPTCM': 'Communications and Marketing Committee',
      'YSPTFR': 'Finance and Treasury Committee',
      'YSPTSD': 'Secretariat and Documentation Committee',
      'YSPTER': 'External Relations Committee',
      'YSPTPD': 'Program Development Committee'
    };
    return mapping[prefix] || 'N/A';
  };

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { searchProfilesFromGAS, getPendingApplicationsFromGAS } = await import("../services/gasApi");

        // Fetch Members
        const result = await searchProfilesFromGAS('');
        if (result.success && Array.isArray(result.profiles)) {
          setMembers(result.profiles.map((p: any) => ({
            id: p.idCode,
            name: p.fullName,
            position: p.position,
            role: p.role,
            committee: getCommitteeFromId(p.idCode),
            status: p.status || "Active", // Use backend status or default to Active
            email: p.email,
            phone: p.contact,
            dateJoined: p.dateJoined || new Date().toISOString().split('T')[0], // Use backend date or today
            // Extended info
            address: p.address,
            dateOfBirth: p.birthday,
            age: p.age,
            gender: p.gender,
            civilStatus: p.civilStatus,
            nationality: p.nationality,
            profilePicture: p.profilePic
          })));
        }

        // Fetch Pending Applications
        const pendingResult = await getPendingApplicationsFromGAS();
        if (pendingResult.success && Array.isArray(pendingResult.applications)) {
          setPendingApplications(pendingResult.applications);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
        toast.error("Failed to load members");
      }
    };
    fetchMembers();
  }, []);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    const matchesCommittee = filterCommittee === "all" || member.committee === filterCommittee;
    return matchesSearch && matchesRole && matchesCommittee;
  });

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "Active").length;
  const pendingCount = pendingApplications.filter((a) => a.status === "pending").length;

  const handleExport = async () => {
    toast.info("Exporting members...", {
      description: "Please wait while we fetch the data...",
    });

    try {
      const { exportMembersFromGAS } = await import("../services/gasApi");
      const result = await exportMembersFromGAS();

      if (result.success && Array.isArray(result.members)) {
        // Convert to CSV
        if (result.members.length === 0) {
          toast.warning("No members to export");
          return;
        }

        const headers = Object.keys(result.members[0]);
        const csvContent = [
          headers.join(','),
          ...result.members.map((row: any) => headers.map(header => {
            const cell = row[header] === null || row[header] === undefined ? '' : row[header];
            return `"${String(cell).replace(/"/g, '""')}"`;
          }).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `ysp_members_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Export complete!", {
          description: `${result.members.length} members exported.`,
        });
      } else {
        toast.error(result.message || "Failed to export members");
      }
    } catch (error) {
      console.error("Error exporting members:", error);
      toast.error("Failed to export members");
    }
  };

  const handleViewApplication = (application: PendingApplication) => {
    setSelectedApplication(application);
    setShowPendingsModal(false);
  };

  const handleViewMember = async (member: Member) => {
    setSelectedMember(member);
    setShowViewMemberModal(true);

    try {
      const { getUserProfileFromGAS } = await import("../services/gasApi");
      const result = await getUserProfileFromGAS(member.id);

      if (result.success && result.profile) {
        const p = result.profile;
        setSelectedMember(prev => prev?.id === member.id ? {
          ...prev,
          address: p.address,
          dateOfBirth: p.dateOfBirth,
          age: p.age,
          gender: p.gender,
          civilStatus: p.civilStatus,
          nationality: p.nationality,
          profilePicture: p.profilePictureURL,
          emergencyContact: p.emergencyContactName,
          emergencyPhone: p.emergencyContactNumber,
        } : prev);
      }
    } catch (error) {
      console.error("Error fetching member details:", error);
    }
  };

  const handleEditMember = async (member: Member) => {
    setSelectedMember(member);
    setShowEditMemberModal(true);

    try {
      const { getUserProfileFromGAS } = await import("../services/gasApi");
      const result = await getUserProfileFromGAS(member.id);

      if (result.success && result.profile) {
        const p = result.profile;
        setSelectedMember(prev => prev?.id === member.id ? {
          ...prev,
          address: p.address,
          dateOfBirth: p.dateOfBirth,
          age: p.age,
          gender: p.gender,
          civilStatus: p.civilStatus,
          nationality: p.nationality,
          profilePicture: p.profilePictureURL,
          emergencyContact: p.emergencyContactName,
          emergencyPhone: p.emergencyContactNumber,
        } : prev);
      }
    } catch (error) {
      console.error("Error fetching member details:", error);
    }
  };

  const handleClosePendingsModal = () => {
    setShowPendingsModal(false);
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      const { approveApplicationInGAS } = await import("../services/gasApi");
      const result = await approveApplicationInGAS(applicationId);
      if (result.success) {
        toast.success("Application Approved!", {
          description: "Member has been added to the system",
        });
        setSelectedApplication(null);
        fetchMembers(); // Refresh list
      } else {
        toast.error(result.message || "Failed to approve application");
      }
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error("Failed to approve application");
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const { rejectApplicationInGAS } = await import("../services/gasApi");
      const result = await rejectApplicationInGAS(applicationId);
      if (result.success) {
        toast.error("Application Rejected", {
          description: "Applicant will be notified via email",
        });
        setSelectedApplication(null);
        fetchMembers(); // Refresh list
      } else {
        toast.error(result.message || "Failed to reject application");
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    }
  };

  const handleSendEmail = (email: string) => {
    toast.info("Email Composer", {
      description: `Opening email to ${email}`,
    });
  };

  const glassStyle = getGlassStyle(isDark);

  return (
    <PageLayout
      title="Manage Members"
      subtitle="Oversee member roster and pending applications"
      isDark={isDark}
      onClose={onClose}
      breadcrumbs={[
        { label: "Home", onClick: onClose },
        { label: "Dashboard & Directory", onClick: undefined },
        { label: "Manage Members", onClick: undefined },
      ]}
      actions={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowPendingsModal(true)}
            icon={<Clock className="w-5 h-5" />}
          >
            Pendings ({pendingCount})
          </Button>
          <Button
            variant="ghost"
            onClick={handleExport}
            icon={<Download className="w-5 h-5" />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAddMemberModal(true)}
            icon={<UserPlus className="w-5 h-5" />}
          >
            Add Member
          </Button>
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div
          className="rounded-xl p-6 border"
          style={{
            background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <p className="text-muted-foreground text-sm mb-2">Total Members</p>
          <h3
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.h1}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.brand.red,
            }}
          >
            {totalMembers}
          </h3>
        </div>

        <div
          className="rounded-xl p-6 border"
          style={{
            background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <p className="text-muted-foreground text-sm mb-2">Active Members</p>
          <h3
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.h1}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: "#10b981",
            }}
          >
            {activeMembers}
          </h3>
        </div>

        <div
          className="rounded-xl p-6 border"
          style={{
            background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <p className="text-muted-foreground text-sm mb-2">Pending Applications</p>
          <h3
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.h1}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.brand.orange,
            }}
          >
            {pendingCount}
          </h3>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
            style={{
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>

        <CustomDropdown
          value={filterRole}
          onChange={setFilterRole}
          options={[
            { value: "all", label: "All Roles" },
            { value: "Admin", label: "Admin" },
            { value: "Officer", label: "Officer" },
            { value: "Member", label: "Member" },
            { value: "Volunteer", label: "Volunteer" },
          ]}
          isDark={isDark}
          size="md"
          className="min-w-[180px]"
        />

        <CustomDropdown
          value={filterCommittee}
          onChange={setFilterCommittee}
          options={[
            { value: "all", label: "All Committees" },
            { value: "Executive Board", label: "Executive Board" },
            { value: "Community Development", label: "Community Development" },
            { value: "Environmental Conservation", label: "Environmental Conservation" },
            { value: "Youth Development", label: "Youth Development" },
          ]}
          isDark={isDark}
          size="md"
          className="min-w-[180px]"
        />
      </div>

      {/* Members Table */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}>
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}>
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}>
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}>
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}>
                  Committee
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {member.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}>
                        {member.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {member.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor:
                          member.role === "Admin"
                            ? "#f6421f20"
                            : member.role === "Officer"
                              ? "#ee872420"
                              : "#10b98120",
                        color:
                          member.role === "Admin"
                            ? "#f6421f"
                            : member.role === "Officer"
                              ? "#ee8724"
                              : "#10b981",
                        fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                      }}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{member.committee}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: member.status === "Active" ? "#10b98120" : "#6b728020",
                        color: member.status === "Active" ? "#10b981" : "#6b7280",
                        fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                      }}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewMember(member)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendEmail(member.email)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No members found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Pendings Modal */}
      {showPendingsModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPendingsModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border"
            style={{
              background: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                style={{
                  fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                  fontSize: `${DESIGN_TOKENS.typography.fontSize.h2}px`,
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                  color: DESIGN_TOKENS.colors.brand.red,
                }}
              >
                Pending Applications ({pendingCount})
              </h3>
              <button
                onClick={() => setShowPendingsModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {pendingApplications.filter(a => a.status === "pending").map((application) => (
                <div
                  key={application.id}
                  className="rounded-xl p-6 border cursor-pointer hover:shadow-lg transition-all"
                  style={{
                    background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                  onClick={() => handleViewApplication(application)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4
                        className="mb-2"
                        style={{
                          fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                          fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                          fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                          color: DESIGN_TOKENS.colors.brand.orange,
                        }}
                      >
                        {application.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-1">{application.email}</p>
                      <p className="text-sm text-muted-foreground mb-2">{application.phone}</p>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {application.committee}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                          Applied: {new Date(application.dateApplied).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg text-white transition-all hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, #f6421f 0%, #ee8724 100%)",
                        fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                      }}
                    >
                      View Application
                    </button>
                  </div>
                </div>
              ))}

              {pendingApplications.filter(a => a.status === "pending").length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No pending applications</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Panel (Resume Style) - will be in a separate component due to size */}
      {selectedApplication && (
        <ApplicationPanel
          application={selectedApplication}
          isDark={isDark}
          onClose={() => setSelectedApplication(null)}
          onApprove={handleApproveApplication}
          onReject={handleRejectApplication}
          onSendEmail={handleSendEmail}
        />
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          isDark={isDark}
          onClose={() => setShowAddMemberModal(false)}
          onSave={async (newMember) => {
            try {
              const { addMemberToGAS } = await import("../services/gasApi");
              const result = await addMemberToGAS({
                name: newMember.name,
                email: newMember.email,
                phone: newMember.phone,
                position: newMember.position,
                role: newMember.role,
                committee: newMember.committee,
                status: newMember.status
              });

              if (result.success) {
                toast.success("Member added successfully!");
                setShowAddMemberModal(false);
                fetchMembers(); // Refresh list
              } else {
                toast.error(result.message || "Failed to add member");
              }
            } catch (error) {
              console.error("Error adding member:", error);
              toast.error("Failed to add member");
            }
          }}
        />
      )}

      {/* Edit Member Modal */}
      {showEditMemberModal && selectedMember && (
        <EditMemberModal
          isDark={isDark}
          member={selectedMember}
          onClose={() => {
            setShowEditMemberModal(false);
            setSelectedMember(null);
          }}
          onSave={async (updatedMember) => {
            try {
              const { updateProfileInGAS } = await import("../services/gasApi");
              // We use updateProfileInGAS which expects idCode and fields to update
              const result = await updateProfileInGAS({
                idCode: updatedMember.id,
                fullName: updatedMember.name,
                email: updatedMember.email,
                contactNumber: updatedMember.phone,
                position: updatedMember.position,
                role: updatedMember.role,
                committee: updatedMember.committee,
                // Add other fields if editable in modal
              });

              if (result.success) {
                toast.success("Member updated successfully!");
                setShowEditMemberModal(false);
                setSelectedMember(null);
                fetchMembers(); // Refresh list
              } else {
                toast.error(result.message || "Failed to update member");
              }
            } catch (error) {
              console.error("Error updating member:", error);
              toast.error("Failed to update member");
            }
          }}
        />
      )}

      {/* View Member Modal */}
      {showViewMemberModal && selectedMember && (
        <ViewMemberModal
          isDark={isDark}
          member={selectedMember}
          onClose={() => {
            setShowViewMemberModal(false);
            setSelectedMember(null);
          }}
          onEdit={() => {
            setShowViewMemberModal(false);
            setShowEditMemberModal(true);
          }}
        />
      )}
    </PageLayout>
  );
}

// Application Panel Component (Resume Style)
interface ApplicationPanelProps {
  application: PendingApplication;
  isDark: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSendEmail: (email: string) => void;
}

function ApplicationPanel({
  application,
  isDark,
  onClose,
  onApprove,
  onReject,
  onSendEmail,
}: ApplicationPanelProps) {
  const data = application.fullData;
  const [statusAction, setStatusAction] = useState<"approve" | "reject" | "pending" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="rounded-xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto border my-8"
        style={{
          background: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}>
          <div className="flex gap-6 flex-1">
            {/* Profile Picture */}
            <div
              className="rounded-full flex items-center justify-center bg-gradient-to-br from-[#f6421f] to-[#ee8724] text-white overflow-hidden"
              style={{
                width: '120px',
                height: '120px',
                border: '4px solid #ee8724',
              }}
            >
              {data.profilePicture ? (
                <img src={data.profilePicture} alt={data.fullName} className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: '48px', fontWeight: DESIGN_TOKENS.typography.fontWeight.bold }}>
                  {data.fullName.charAt(0)}
                </span>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2
                className="mb-2"
                style={{
                  fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                  fontSize: '32px',
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
                  color: DESIGN_TOKENS.colors.brand.red,
                }}
              >
                {data.fullName}
              </h2>
              <p className="text-muted-foreground mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {data.email}
              </p>
              <p className="text-muted-foreground mb-1">📞 {data.phone}</p>
              <p className="text-muted-foreground">📍 {data.address}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 ml-4">
            <button
              onClick={() => onApprove(application.id)}
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all flex items-center gap-2"
              style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onReject(application.id)}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all flex items-center gap-2"
              style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => onSendEmail(data.email)}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all flex items-center gap-2"
              style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => toast.info("PDF download feature coming soon!")}
              className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-all flex items-center gap-2"
              style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
            >
              <FileText className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <InfoCard title="Gender" value={data.gender} isDark={isDark} />
          <InfoCard title="Date of Birth" value={new Date(data.dateOfBirth).toLocaleDateString()} isDark={isDark} />
          <InfoCard title="Age" value={`${data.age} years old`} isDark={isDark} />
          <InfoCard title="Civil Status" value={data.civilStatus} isDark={isDark} />
          <InfoCard title="Nationality" value={data.nationality} isDark={isDark} />
          <InfoCard title="YSP Chapter" value={data.chapter} isDark={isDark} />
          <InfoCard title="Committee Preference" value={data.committeePreference} isDark={isDark} />
          <InfoCard title="Desired Role" value={data.desiredRole} isDark={isDark} />
        </div>

        {/* Additional Information Sections */}
        {data.skills && <DetailCard title="Skills" content={data.skills} isDark={isDark} />}
        {data.education && <DetailCard title="Education" content={data.education} isDark={isDark} />}
        {data.certifications && <DetailCard title="Certifications" content={data.certifications} isDark={isDark} />}
        {data.experience && <DetailCard title="Experience" content={data.experience} isDark={isDark} />}
        {data.achievements && <DetailCard title="Achievements" content={data.achievements} isDark={isDark} />}
        {data.volunteerHistory && <DetailCard title="Volunteer History" content={data.volunteerHistory} isDark={isDark} />}
        {data.reasonForJoining && <DetailCard title="Reason for Joining" content={data.reasonForJoining} isDark={isDark} />}
        {data.personalStatement && <DetailCard title="Personal Statement" content={data.personalStatement} isDark={isDark} />}

        {/* Emergency Contact */}
        {data.emergencyContactName && (
          <div className="mb-6">
            <h4
              className="mb-3"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              Emergency Contact
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <InfoCard title="Name" value={data.emergencyContactName} isDark={isDark} />
              <InfoCard title="Relation" value={data.emergencyContactRelation || ""} isDark={isDark} />
              <InfoCard title="Contact" value={data.emergencyContactNumber || ""} isDark={isDark} />
            </div>
          </div>
        )}

        {/* Social Media */}
        {(data.facebook || data.instagram || data.twitter) && (
          <div className="mb-6">
            <h4
              className="mb-3"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              Social Media
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              {data.facebook && <InfoCard title="Facebook" value={data.facebook} isDark={isDark} />}
              {data.instagram && <InfoCard title="Instagram" value={data.instagram} isDark={isDark} />}
              {data.twitter && <InfoCard title="Twitter" value={data.twitter} isDark={isDark} />}
            </div>
          </div>
        )}

        {/* Attachments */}
        {data.attachments && data.attachments.length > 0 && (
          <div className="mb-6">
            <h4
              className="mb-3"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.orange,
              }}
            >
              Attachments
            </h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.attachments.map((attachment, idx) => (
                <div
                  key={idx}
                  className="rounded-lg p-4 border"
                  style={{
                    background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <p className="text-sm text-muted-foreground mb-1">{attachment.type}</p>
                  <p className="text-sm mb-2" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.medium }}>
                    {attachment.name}
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      View
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                      onClick={() => toast.success("Download started")}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Notes Section */}
        <div
          className="rounded-lg p-4 border mt-6"
          style={{
            background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <h4
            className="mb-3"
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.brand.orange,
            }}
          >
            Admin Notes
          </h4>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add internal notes about this application..."
            className="w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none resize-none"
            rows={3}
            style={{
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface InfoCardProps {
  title: string;
  value: string;
  isDark: boolean;
}

function InfoCard({ title, value, isDark }: InfoCardProps) {
  return (
    <div
      className="rounded-lg p-4 border"
      style={{
        background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }}
    >
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className="text-sm" style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.medium }}>
        {value}
      </p>
    </div>
  );
}

interface DetailCardProps {
  title: string;
  content: string;
  isDark: boolean;
}

function DetailCard({ title, content, isDark }: DetailCardProps) {
  return (
    <div
      className="rounded-lg p-4 border mb-4"
      style={{
        background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }}
    >
      <h4
        className="mb-2"
        style={{
          fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
          fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
          fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
          color: DESIGN_TOKENS.colors.brand.orange,
        }}
      >
        {title}
      </h4>
      <p className="text-sm text-muted-foreground">{content}</p>
    </div>
  );
}