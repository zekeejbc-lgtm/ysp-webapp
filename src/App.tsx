import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Mail,
  Phone,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Music,
  Upload,
  Trash2,
  X,
  Menu,
  ZoomIn,
  ExternalLink,
  ChevronDown,
  User,
  Home,
  LayoutDashboard,
  Calendar,
  MessageSquare,
  FileText,
  QrCode,
  Users,
  ClipboardList,
  HandHeart,
  MessageCircle,
  Network,
  BarChart3,
  Plus,
  Edit3,
  Save,
} from "lucide-react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { toast, Toaster } from "sonner";
import { loginWithGAS, guestLoginWithGAS, getHomepageContentFromGAS } from "./services/gasApi";
import { ShimmerContentCard } from "./components/ShimmerSkeleton";
import { TextShimmer } from "./components/TextShimmer";
import DonationPage from "./components/DonationPage";
import LoginPanel from "./components/LoginPanel";
import TabangTaBaiPage from "./components/TabangTaBaiPage";
import FeedbackPage from "./components/FeedbackPage";
import OfficerDirectoryPage from "./components/OfficerDirectoryPage";
import AttendanceDashboardPage from "./components/AttendanceDashboardPage";
import QRScannerPage from "./components/QRScannerPage";
import ManualAttendancePage from "./components/ManualAttendancePage";
import ManageEventsPage from "./components/ManageEventsPage";
import MyQRIDPage from "./components/MyQRIDPage";
import AttendanceTransparencyPage from "./components/AttendanceTransparencyPage";
import MyProfilePage from "./components/MyProfilePage";
import AnnouncementsPage from "./components/AnnouncementsPage_Enhanced";
import AccessLogsPage from "./components/AccessLogsPage";
import SystemToolsPage from "./components/SystemToolsPage";
import ManageMembersPage from "./components/ManageMembersPage";
import PollingEvaluationsPage from "./components/PollingEvaluationsPage";
import FounderModal from "./components/FounderModal";
import DeveloperModal from "./components/DeveloperModal";
import CreateProjectModal from "./components/CreateProjectModal";
import UploadChartModal from "./components/UploadChartModal";
import { SideBar } from "./components/design-system";
import TopBar from "./components/design-system/TopBar";
import AnimatedHamburger from "./components/design-system/AnimatedHamburger";
import GlowingCard from "./components/GlowingCard";
import type { NavGroup, NavPage } from "./components/design-system";

/**
 * Convert plain text into React nodes with clickable links.
 * Detects: http/https URLs, www.* URLs, and email addresses.
 * Preserves line breaks and spacing when rendered inside a pre-wrap container.
 */
function renderLinkifiedText(text: string): React.ReactNode[] {
  if (!text) return [''];
  const elements: React.ReactNode[] = [];

  // First, split by line breaks and process each line
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      elements.push(<br key={`br-${lineIndex}`} />);
    }

    // Process hashtags in the line
    const hashtagRegex = /(#\w+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = hashtagRegex.exec(line)) !== null) {
      const start = match.index;
      const full = match[0];
      const end = start + full.length;

      if (lastIndex < start) {
        // Process the text before hashtag for links
        const beforeText = line.slice(lastIndex, start);
        elements.push(...processLinksInText(beforeText, `before-${lineIndex}-${lastIndex}`));
      }

      // Add the hashtag with styling
      elements.push(
        <span key={`hashtag-${lineIndex}-${start}`} className="project-hashtag" style={{ color: '#f6421f', fontWeight: '600' }}>
          {full}
        </span>
      );

      lastIndex = end;
    }

    // Process remaining text after last hashtag
    if (lastIndex < line.length) {
      const remainingText = line.slice(lastIndex);
      elements.push(...processLinksInText(remainingText, `after-${lineIndex}-${lastIndex}`));
    }
  });

  return elements;
}

/**
 * Helper function to process links in text
 */
function processLinksInText(text: string, prefix: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const regex = /(https?:\/\/[^\s]+)|((?:www\.)[^\s]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const full = match[0];
    const httpUrl = match[1];
    const wwwUrl = match[2];
    const email = match[3];
    const end = start + full.length;
    if (lastIndex < start) {
      elements.push(text.slice(lastIndex, start));
    }

    let href = '';
    if (httpUrl) href = httpUrl;
    else if (wwwUrl) href = `http://${wwwUrl}`;
    else if (email) href = `mailto:${email}`;
    else href = full;

    // For long http/www links show a short label to avoid overflowing the UI.
    const isUrl = !!(httpUrl || wwwUrl);
    const displayText = email ? full : isUrl ? (
      <span className="flex items-center gap-1">
        <ExternalLink size={14} />
        Open: {new URL(href).hostname}
      </span>
    ) : full;

    elements.push(
      <a
        key={`${prefix}-lnk-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={href}
        aria-label={href}
        className="inline-block w-full text-[#f6421f] dark:text-[#ee8724] underline hover:opacity-90 break-words break-all whitespace-normal"
        style={{ display: 'block', width: '100%', wordBreak: 'break-all', overflowWrap: 'anywhere' }}
      >
        {displayText}
      </a>
    );

    lastIndex = end;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

// Project type definition
interface Project {
  id: number;
  number?: number;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  linkText?: string;
}

// Donation type definition
interface Donation {
  id: number;
  name: string;
  amount: number;
  date: string;
  status: "pending" | "verified" | "rejected";
  receiptUrl?: string;
}

// Navigation types come from design-system

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalProject, setModalProject] =
    useState<Project | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("guest"); // guest, member, admin
  const [userName, setUserName] = useState<string>("Juan Dela Cruz");
  const [userUsername, setUserUsername] = useState<string>("");
  const [userIdCode, setUserIdCode] = useState<string>("");
  const [userProfilePicture, setUserProfilePicture] = useState<string>("");
  const [userCommittee, setUserCommittee] = useState<string>("");
  const [userPosition, setUserPosition] = useState<string>("");
  const [logoError, setLogoError] = useState(false);
  const [showDonationPage, setShowDonationPage] =
    useState(false);
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [showTabangTaBaiPage, setShowTabangTaBaiPage] = useState(false);
  const [showFeedbackPage, setShowFeedbackPage] = useState(false);
  const [showOfficerDirectory, setShowOfficerDirectory] = useState(false);
  const [showAttendanceDashboard, setShowAttendanceDashboard] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showManualAttendance, setShowManualAttendance] = useState(false);
  const [showManageEvents, setShowManageEvents] = useState(false);
  const [showMyQRID, setShowMyQRID] = useState(false);
  const [showAttendanceTransparency, setShowAttendanceTransparency] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showAccessLogs, setShowAccessLogs] = useState(false);
  const [showSystemTools, setShowSystemTools] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showPollingEvaluations, setShowPollingEvaluations] = useState(false);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showUploadChart, setShowUploadChart] = useState(false);
  const [projectDeleteMode, setProjectDeleteMode] = useState(false);
  const [activePage, setActivePage] = useState<string>("home");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  // Sidebar open state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Homepage content editing states
  const [homepageContent, setHomepageContent] = useState<any>({
    hero: { mainHeading: '', subHeading: '', tagline: '', membershipURL: '' },
    about: { title: '', content: '' },
    mission: { title: '', content: '' },
    vision: { title: '', content: '' },
    advocacyPillars: { title: '', intro: '', pillars: [] },
    contact: { title: '', email: '', emailHref: '', phone: '', phoneHref: '', location: '', locationLink: '', socialLink: '', socialLabel: '', socialText: '', partnerButtonLink: '', partnerButtonText: '', partnerTitle: '', partnerDescription: '' },
    projects: [],
    orgChartUrl: ''
  });
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isEditingHomepage, setIsEditingHomepage] = useState(false);
  const [editedContent, setEditedContent] = useState<any>(homepageContent);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  // Load homepage content from backend
  const loadHomepageContent = async () => {
    setIsLoadingContent(true);
    setBackendError(null);
    try {
      const data = await getHomepageContentFromGAS();
      if (data && data.success && data.content) {
        // Map hero fields
        const mappedHero = {
          mainHeading: data.content.hero_main_heading || data.content.title || "Welcome to Youth Service Philippines",
          subHeading: data.content.hero_sub_heading || data.content.subtitle || "Tagum Chapter",
          tagline: data.content.hero_tagline || data.content.motto || "Empowering youth to serve communities",
          membershipURL: data.content.membership_URL || ""
        };
        setHomepageContent({
          ...data.content,
          hero: mappedHero
        });
        setEditedContent({
          ...data.content,
          hero: mappedHero
        });
        // Set projects, org chart, founders, developers if present
        if (data.content.projects) setProjects(data.content.projects.map((p: any) => ({
          id: p.id || p.title,
          title: p.title || '',
          description: p.description || '',
          imageUrl: p.image || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80',
          link: p.link || '',
          linkText: p.linkText || 'Learn More'
        })));
        if (data.content.orgChartUrl) setOrgChartUrl(data.content.orgChartUrl);
        if (data.content.founders) setFounders(data.content.founders);
        if (data.content.developers) setDevelopers(data.content.developers);
      } else {
        setBackendError('Failed to load homepage content from backend.');
      }
    } catch (e: any) {
      console.error('Error loading homepage content:', e);
      setBackendError('Backend error: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Fetch homepage content from GAS backend on mount
  useEffect(() => {
    loadHomepageContent();
  }, []);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const sessionData = localStorage.getItem('ysp.session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.isAdmin) {
          setIsAdmin(session.isAdmin);
          setUserRole(session.userRole);
          setUserName(session.userName);
          setUserUsername(session.userUsername || '');
          setUserIdCode(session.userIdCode);
          setUserProfilePicture(session.userProfilePicture);
          setUserCommittee(session.userCommittee || '');
          setUserPosition(session.userPosition || '');
        }
      }
    } catch (error) {
      console.error('Error loading session from localStorage:', error);
    }
  }, []);

  // Dev helper: expose a manual force-reload to the window for diagnostics
  useEffect(() => {
    (window as any).forceReloadHomepage = async () => {
      try {
        const data = await getHomepageContentFromGAS();
        if (data && data.success) {
          const mappedHero = {
            mainHeading: data.content.hero_main_heading || data.content.title || "Welcome to Youth Service Philippines",
            subHeading: data.content.hero_sub_heading || data.content.subtitle || "Tagum Chapter",
            tagline: data.content.hero_tagline || data.content.motto || "Empowering youth to serve communities",
            loginButtonText: "Log In",
            memberButtonText: "Be a Member!",
            membershipURL: data.content.membership_URL || "",
          } as const;

          console.log('[DEBUG] Manual reload - GAS hero fields:', {
            hero_main_heading: data.content.hero_main_heading,
            title: data.content.title,
            hero_sub_heading: data.content.hero_sub_heading,
            subtitle: data.content.subtitle,
            hero_tagline: data.content.hero_tagline,
            motto: data.content.motto,
          });
          console.log('[DEBUG] Manual reload - mapped hero fields:', mappedHero);

          setHomepageContent((prev) => ({
            ...prev,
            hero: mappedHero,
          }));
        }
      } catch (e) {
        console.error('forceReloadHomepage error:', e);
      }
    };
    return () => {
      try {
        delete (window as any).forceReloadHomepage;
      } catch { }
    };
  }, []);

  // Real donation data from GAS
  const [donations, setDonations] = useState<Donation[]>([]);

  // Fetch donations from GAS
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const result = await import("./services/gasApi").then(m => m.getDonationsFromGAS());
        if (result.success && Array.isArray(result.donations)) {
          // Map GAS donation structure to frontend Donation interface
          const mappedDonations: Donation[] = result.donations.map((d: any) => ({
            id: parseInt(d.id) || 0,
            name: d.donorName || 'Anonymous',
            amount: parseFloat(d.amount) || 0,
            date: d.timestamp ? new Date(d.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: (d.status?.toLowerCase() === 'verified' ? 'verified' : d.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending') as any,
            receiptUrl: d.receiptUrl
          }));
          setDonations(mappedDonations);
        }
      } catch (error) {
        console.error("Error fetching donations:", error);
      }
    };

    fetchDonations();
  }, []);

  // YSP Logo URLs
  const primaryLogoUrl = "https://i.imgur.com/J4wddTW.png";
  const fallbackLogoUrl =
    "https://ui-avatars.com/api/?name=YSP&size=80&background=f6421f&color=fff";

  const [projects, setProjects] = useState<Project[]>([]);
  const [orgChartUrl, setOrgChartUrl] = useState<string>('');
  const [founders, setFounders] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);

  // Navigation Groups Configuration
  const navigationGroups: NavGroup[] = [
    {
      id: "home-group",
      label: "Home",
      icon: <Home className="w-5 h-5" />,
      pages: [
        {
          id: "about",
          label: "About",
          action: () => {
            setActivePage("about");
            document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
        },
        {
          id: "projects",
          label: "Projects",
          action: () => {
            setActivePage("projects");
            document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
        },
        {
          id: "contact",
          label: "Contact",
          action: () => {
            setActivePage("contact");
            document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
        },
        {
          id: "feedback",
          label: "Feedback",
          action: () => {
            setActivePage("feedback");
            setShowFeedbackPage(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
        },
        {
          id: "tabang-ta-bai",
          label: "Tabang ta Bai",
          action: () => {
            setActivePage("tabang-ta-bai");
            setShowTabangTaBaiPage(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
        },
      ],
    },
    {
      id: "dashboard-directory",
      label: "Dashboard & Directory",
      icon: <LayoutDashboard className="w-5 h-5" />,
      pages: [
        {
          id: "officer-directory",
          label: "Officer Directory Search",
          action: () => {
            setActivePage("officer-directory");
            setShowOfficerDirectory(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["member"], // member and above (head, admin, auditor)
        },
        {
          id: "manage-members",
          label: "Manage Members",
          action: () => {
            setActivePage("manage-members");
            setShowManageMembers(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["admin"], // admin and above (auditor)
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: "attendance-dashboard",
          label: "Attendance Dashboard",
          action: () => {
            setActivePage("attendance-dashboard");
            setShowAttendanceDashboard(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["head"], // head and above (admin, auditor)
        },
      ],
      roles: ["member"], // member and above can see this group
    },
    {
      id: "attendance-management",
      label: "Attendance Management",
      icon: <QrCode className="w-5 h-5" />,
      pages: [
        {
          id: "qr-scanner",
          label: "QR Attendance Scanner",
          action: () => {
            setActivePage("qr-scanner");
            setShowQRScanner(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["head"], // head and above (admin, auditor)
        },
        {
          id: "manual-attendance",
          label: "Manual Attendance",
          action: () => {
            setActivePage("manual-attendance");
            setShowManualAttendance(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["admin"], // admin and above (auditor)
        },
        {
          id: "manage-events",
          label: "Manage Events",
          action: () => {
            setActivePage("manage-events");
            setShowManageEvents(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["admin"], // admin and above (auditor)
        },
        {
          id: "my-qr-id",
          label: "My QR ID",
          action: () => {
            setActivePage("my-qr-id");
            setShowMyQRID(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["member"], // member and above
        },
        {
          id: "attendance-transparency",
          label: "Attendance Transparency",
          action: () => {
            setActivePage("attendance-transparency");
            setShowAttendanceTransparency(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["member"], // member and above
        },
      ],
      roles: ["member"], // member and above can see this group
    },
    {
      id: "communication",
      label: "Communication Center",
      icon: <MessageSquare className="w-5 h-5" />,
      pages: [
        {
          id: "announcements",
          label: "Announcements",
          action: () => {
            setActivePage("announcements");
            setShowAnnouncements(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["member"], // member and above
        },
        {
          id: "polling-evaluations",
          label: "Polling & Evaluations",
          action: () => {
            setActivePage("polling-evaluations");
            setShowPollingEvaluations(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["member"], // member and above
          icon: <BarChart3 className="w-4 h-4" />,
        },
        {
          id: "feedback",
          label: "Feedback",
          action: () => {
            setActivePage("feedback");
            setShowFeedbackPage(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          icon: <MessageCircle className="w-4 h-4" />,
          // Public - no roles required
        },
        {
          id: "tabang-ta-bai",
          label: "Tabang ta Bai",
          action: () => {
            setActivePage("tabang-ta-bai");
            setShowTabangTaBaiPage(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          icon: <HandHeart className="w-4 h-4" />,
          // Public - no roles required
        },
      ],
      // Public group - no roles required
    },
    {
      id: "logs-reports",
      label: "Logs & Reports",
      icon: <FileText className="w-5 h-5" />,
      pages: [
        {
          id: "access-logs",
          label: "Access Logs",
          action: () => {
            setActivePage("access-logs");
            setShowAccessLogs(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["auditor"], // auditor only (highest access)
        },
        {
          id: "system-tools",
          label: "System Tools",
          action: () => {
            setActivePage("system-tools");
            setShowSystemTools(true);
            setOpenDropdown(null);
            setIsMenuOpen(false);
          },
          roles: ["admin"], // admin and above (auditor)
        },
      ],
      roles: ["admin"], // admin and above can see this group
    },
  ];

  // Role Hierarchy Helper - Check if user has access based on role hierarchy
  // auditor (highest) > admin > head > member > suspended > banned (no access)
  const hasRoleAccess = (requiredRoles: string[] | undefined): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) return true; // Public access

    // Define role hierarchy levels (higher number = more access)
    const roleHierarchy: Record<string, number> = {
      banned: 0,      // No access
      suspended: 1,   // Minimal access
      member: 2,      // Standard access
      head: 3,        // Leadership access
      admin: 4,       // Management access
      auditor: 5,     // Highest access
    };

    const userLevel = roleHierarchy[userRole] || 0;

    // Check if user's role level meets ANY of the required roles
    return requiredRoles.some(role => {
      const requiredLevel = roleHierarchy[role] || 0;
      return userLevel >= requiredLevel;
    });
  };

  // Filter groups and pages based on user role
  const getVisibleGroups = () => {
    // If not logged in, return public pages only (flat list for sidebar)
    // NOTE: Home and Login are handled by dedicated UI elements in the sidebar,
    // so they should NOT be included in this pages array to avoid duplicates
    if (!isAdmin) {
      return [{
        id: "public-pages",
        label: "Navigation",
        icon: <Home className="w-5 h-5" />,
        pages: [
          {
            id: "about",
            label: "About",
            icon: <Users className="w-5 h-5" />,
            action: () => {
              setActivePage("about");
              document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
              setIsSidebarOpen(false);
            },
          },
          {
            id: "projects",
            label: "Projects",
            icon: <ClipboardList className="w-5 h-5" />,
            action: () => {
              setActivePage("projects");
              document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
              setIsSidebarOpen(false);
            },
          },
          {
            id: "contact",
            label: "Contact",
            icon: <Mail className="w-5 h-5" />,
            action: () => {
              setActivePage("contact");
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              setIsSidebarOpen(false);
            },
          },
          {
            id: "polling-evaluations",
            label: "Polling & Evaluations",
            icon: <BarChart3 className="w-5 h-5" />,
            action: () => {
              setActivePage("polling-evaluations");
              setShowPollingEvaluations(true);
              setIsSidebarOpen(false);
            },
          },
          {
            id: "feedback",
            label: "Feedback",
            icon: <MessageCircle className="w-5 h-5" />,
            action: () => {
              setActivePage("feedback");
              setShowFeedbackPage(true);
              setIsSidebarOpen(false);
            },
          },
          {
            id: "tabang-ta-bai",
            label: "Tabang ta Bai",
            icon: <HandHeart className="w-5 h-5" />,
            action: () => {
              setActivePage("tabang-ta-bai");
              setShowTabangTaBaiPage(true);
              setIsSidebarOpen(false);
            },
          },
        ],
      }];
    }

    // Suspended users only see their profile (minimal access)
    if (userRole === 'suspended') {
      return [{
        id: "restricted-access",
        label: "Limited Access",
        icon: <Users className="w-5 h-5" />,
        pages: [
          {
            id: "my-profile",
            label: "My Profile",
            action: () => {
              setActivePage("my-profile");
              setShowMyProfile(true);
              setIsSidebarOpen(false);
            },
          },
        ],
      }];
    }

    return navigationGroups
      .filter((group) => {
        // Filter out home-group when logged in (it's redundant)
        if (group.id === "home-group") return false;
        // Use role hierarchy to check access
        return hasRoleAccess(group.roles);
      })
      .map((group) => ({
        ...group,
        pages: group.pages.filter((page) => {
          // Use role hierarchy to check access
          return hasRoleAccess(page.roles);
        }),
      }))
      .filter((group) => group.pages.length > 0);
  };

  const toggleDark = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const openProjectModal = (project: Project) => {
    setModalProject(project);
  };

  const closeModal = () => {
    setModalProject(null);
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const result = await loginWithGAS(username, password);

      if (!result.success) {
        toast.error('Login failed', {
          description: result.message || 'Invalid username or password',
        });
        return;
      }

      if (!result.user) {
        toast.error('Login failed', {
          description: 'User data not received',
        });
        return;
      }

      const { user } = result;

      // Handle BANNED accounts - no access
      if (user.role.toLowerCase() === 'banned') {
        toast.error('Account Banned', {
          description: 'This account has been permanently banned. Contact admin for assistance.',
        });
        return;
      }

      // Handle SUSPENDED accounts - minimal access warning
      if (user.role.toLowerCase() === 'guest') {
        setIsAdmin(true);
        setUserRole('guest');
        const derivedName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ').trim() || user.username;
        setUserName(derivedName);
        setUserUsername(user.username || '');
        setUserIdCode(user.id || '');
        setUserProfilePicture(user.profilePicture || '');
        try {
          localStorage.setItem('ysp.session', JSON.stringify({
            isAdmin: true,
            userRole: 'guest',
            userName: derivedName,
            userUsername: user.username || '',
            userIdCode: user.id || '',
            userProfilePicture: user.profilePicture || ''
          }));
        } catch { }
        setShowLoginPanel(false);
        toast.warning('Guest Access', {
          description: 'You have limited guest access. Contact admin for full membership.',
        });
        return;
      }

      // Normal login for all other roles
      setIsAdmin(true);
      setUserRole(user.role.toLowerCase());
      {
        const derivedName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ').trim() || user.username;
        setUserName(derivedName);
        setUserUsername(user.username || '');
        setUserIdCode(user.id || '');
        setUserCommittee(user.committee || '');
        setUserPosition(user.position || '');
        try {
          localStorage.setItem('ysp.session', JSON.stringify({
            isAdmin: true,
            userRole: user.role.toLowerCase(),
            userName: derivedName,
            userUsername: user.username || '',
            userIdCode: user.id || '',
            userProfilePicture: user.profilePicture || '',
            userCommittee: user.committee || '',
            userPosition: user.position || ''
          }));
        } catch { }
      }
      setUserProfilePicture(user.profilePicture || '');
      setShowLoginPanel(false);

      // Role-specific welcome messages
      const roleMessages: Record<string, string> = {
        auditor: 'Welcome, Auditor! You have full system access including audit logs.',
        admin: 'Welcome, Admin! You have full management access.',
        head: 'Welcome, Committee Head! You have leadership access.',
        member: 'Welcome, Member! You have standard access.',
      };

      toast.success('Successfully logged in!', {
        description: roleMessages[user.role.toLowerCase()] || `Welcome, ${([user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ').trim() || user.username)}!`,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setUserRole("guest");
    setActivePage("home");
    toast.success('Successfully logged out');
    try {
      localStorage.removeItem('ysp.session');
    } catch { }
  };

  // Homepage Edit Handlers
  const handleStartEditing = () => {
    if (userRole === 'admin' || userRole === 'auditor') {
      setEditedContent(homepageContent);
      setIsEditingHomepage(true);
      toast.info('Edit mode enabled', {
        description: 'Make your changes and click Save to apply them.',
      });
    }
  };

  const handleCancelEditing = () => {
    setEditedContent(homepageContent);
    setIsEditingHomepage(false);
    toast.info('Changes discarded');
  };

  const handleSaveEditing = async () => {
    if (!userIdCode) {
      toast.error('User session invalid');
      return;
    }

    try {
      // Call backend directly using VITE_GAS_URL
      const response = await fetch(import.meta.env.VITE_GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'updateHomepageContent',
          idCode: userIdCode,
          mission: editedContent.mission.content,
          vision: editedContent.vision.content,
          aboutYSP: editedContent.about.content,
          motto: editedContent.hero.tagline,
          email: editedContent.contact.email,
          phone: editedContent.contact.phone,
          facebook_url: editedContent.contact.socialLink
        })
      });

      const data = await response.json();

      if (data.success) {
        setHomepageContent(editedContent);
        setIsEditingHomepage(false);
        toast.success('Homepage updated successfully!', {
          description: 'All changes have been saved to the backend.',
        });
        // Refetch homepage content to reflect changes
        await loadHomepageContent();
      } else {
        toast.error(data.message || 'Failed to update homepage content');
      }
    } catch (error: any) {
      console.error('Error saving homepage content:', error);
      toast.error(error?.message || 'Failed to update homepage content');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown]);

  // Set active page based on scroll position (optimized with throttle)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = ["home", "about", "projects", "org-chart", "contact"];
          const scrollPosition = window.scrollY + 100;

          for (const section of sections) {
            const element = document.getElementById(section);
            if (element) {
              const offsetTop = element.offsetTop;
              const offsetBottom = offsetTop + element.offsetHeight;
              if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
                setActivePage(section);
                try {
                  localStorage.setItem('ysp.activePage', section);
                } catch { }
                break;
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Also persist scroll position
    const saveScroll = () => {
      try { localStorage.setItem('ysp.scrollY', String(window.scrollY)); } catch { }
    };
    window.addEventListener('scroll', saveScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Show Tabang Ta Bai page if flag is true
  if (showTabangTaBaiPage) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <TabangTaBaiPage
          onClose={() => setShowTabangTaBaiPage(false)}
          isAdmin={isAdmin}
          isDark={isDark}
          userRole={userRole as 'admin' | 'auditor' | 'member'}
        />
      </>
    );
  }

  // Show Feedback page if flag is true
  if (showFeedbackPage) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <FeedbackPage
          onClose={() => setShowFeedbackPage(false)}
          isAdmin={isAdmin}
          isDark={isDark}
          userRole={userRole}
        />
      </>
    );
  }

  // Show Officer Directory page
  if (showOfficerDirectory) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <OfficerDirectoryPage
          onClose={() => setShowOfficerDirectory(false)}
          isDark={isDark}
        />
      </>
    );
  }

  // Show Attendance Dashboard page
  if (showAttendanceDashboard) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <AttendanceDashboardPage
          onClose={() => setShowAttendanceDashboard(false)}
          isDark={isDark}
        />
      </>
    );
  }

  // Show QR Scanner page
  if (showQRScanner) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <QRScannerPage
          onClose={() => setShowQRScanner(false)}
          isDark={isDark}
        />
      </>
    );
  }

  // Show Manual Attendance page
  if (showManualAttendance) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <ManualAttendancePage
          onClose={() => setShowManualAttendance(false)}
          isDark={isDark}
        />
      </>
    );
  }

  // Show Manage Events page
  if (showManageEvents) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <ManageEventsPage
          onClose={() => setShowManageEvents(false)}
          isDark={isDark}
        />
      </>
    );
  }

  // Show My QR ID page
  if (showMyQRID) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <MyQRIDPage
          onClose={() => setShowMyQRID(false)}
          isDark={isDark}
          userInfo={{
            fullName: userName,
            idCode: userIdCode || "N/A",
            position: userRole
          }}
        />
      </>
    );
  }

  // Show Attendance Transparency page
  if (showAttendanceTransparency) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <AttendanceTransparencyPage
          onClose={() => setShowAttendanceTransparency(false)}
          isDark={isDark}
        />
      </>
    );
  }

  // Show My Profile page
  if (showMyProfile) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <MyProfilePage
          onClose={() => setShowMyProfile(false)}
          isDark={isDark}
          userIdCode={userIdCode}
          userProfilePicture={userProfilePicture}
        />
      </>
    );
  }

  // Show Announcements page
  if (showAnnouncements) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <AnnouncementsPage
          onClose={() => setShowAnnouncements(false)}
          isDark={isDark}
          userRole={userRole}
        />
      </>
    );
  }

  // Show Access Logs page
  if (showAccessLogs) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <AccessLogsPage
          onClose={() => setShowAccessLogs(false)}
          isDark={isDark}
        />
      </>
    );
  }

  // Show System Tools page
  if (showSystemTools) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <SystemToolsPage
          onClose={() => setShowSystemTools(false)}
          isDark={isDark}
        />
      </>
    );
  }

  // Show Manage Members page
  if (showManageMembers) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <ManageMembersPage
          onClose={() => setShowManageMembers(false)}
          isDark={isDark}
        />
      </>
    );
  }

  // Show Polling & Evaluations page
  if (showPollingEvaluations) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <PollingEvaluationsPage
          onClose={() => setShowPollingEvaluations(false)}
          isDark={isDark}
          userRole={userRole}
          isLoggedIn={isAdmin}
          userIdCode={userIdCode}
          userName={userName}
          userCommittee={userCommittee}
          userPosition={userPosition}
        />
      </>
    );
  }

  // Show donation page if flag is true
  if (showDonationPage) {
    return (
      <>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
        <DonationPage
          onClose={() => setShowDonationPage(false)}
          donations={donations}
          onDonationsUpdate={setDonations}
          isAdmin={isAdmin}
        />
      </>
    );
  }

  const visibleGroups = getVisibleGroups();

  // Show error state if backend fails
  if (backendError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-8">
        <Toaster position="top-center" richColors closeButton theme={isDark ? "dark" : "light"} />
        <h1 className="text-2xl font-bold text-red-600 mb-4">Unable to load homepage</h1>
        <p className="text-gray-700 dark:text-gray-200 mb-6">{backendError}</p>
        <button
          onClick={loadHomepageContent}
          className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{
      overflow: 'visible',
      background: isDark ? '#0f172a' : '#f8fafc'
    }}>
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/40 dark:bg-orange-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-yellow-200/40 dark:bg-yellow-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-red-200/40 dark:bg-red-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-pink-200/40 dark:bg-pink-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob animation-delay-6000" />
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        theme={isDark ? "dark" : "light"}
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans)",
          },
        }}
      />

      {/* Top Bar - Floating Header - Only on Homepage */}
      {!showOfficerDirectory && !showAttendanceDashboard && !showQRScanner &&
        !showManualAttendance && !showManageEvents && !showMyQRID &&
        !showAttendanceTransparency && !showAnnouncements && !showAccessLogs &&
        !showSystemTools && !showManageMembers && !showPollingEvaluations && !showFeedbackPage && !showTabangTaBaiPage &&
        !showMyProfile && (
          <TopBar
            isDark={isDark}
            onToggleDark={toggleDark}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => {
              setIsSidebarOpen(!isSidebarOpen);
            }}
            logoUrl={logoError ? fallbackLogoUrl : primaryLogoUrl}
            fallbackLogoUrl={fallbackLogoUrl}
            onHomeClick={() => {
              setActivePage("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onAboutClick={() => {
              setActivePage("about");
              document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
            }}
            onProjectsClick={() => {
              setActivePage("projects");
              document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
            }}
            onContactClick={() => {
              setActivePage("contact");
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
            }}
            onOrgChartClick={() => {
              setActivePage("org-chart");
              document.getElementById("org-chart")?.scrollIntoView({ behavior: "smooth" });
            }}
            onPollingClick={() => {
              setActivePage("polling-evaluations");
              setShowPollingEvaluations(true);
            }}
            onFeedbackClick={() => {
              setActivePage("feedback");
              setShowFeedbackPage(true);
            }}
            onTabangTaBaiClick={() => {
              setActivePage("tabang-ta-bai");
              setShowTabangTaBaiPage(true);
            }}
            onLoginClick={() => {
              setShowLoginPanel(true);
            }}
            onLogoutClick={handleLogout}
            isLoggedIn={isAdmin}
            activePage={activePage}
          />
        )}

      {/* Sidebar - Always Visible (Desktop and Mobile) */}
      <SideBar
        isDark={isDark}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navigationGroups={getVisibleGroups()}
        activePage={activePage}
        openMobileGroup={openMobileGroup}
        onMobileGroupToggle={setOpenMobileGroup}
        isLoggedIn={isAdmin}
        userRole={userRole}
        userUsername={userUsername}
        userProfilePicture={userProfilePicture}
        onToggleDark={toggleDark}
        onProfileClick={() => {
          setActivePage("my-profile");
          setShowMyProfile(true);
          setIsSidebarOpen(false);
        }}
        onLogout={handleLogout}
        onHomeClick={() => {
          setActivePage("home");
          // Close all page views
          setShowOfficerDirectory(false);
          setShowAttendanceDashboard(false);
          setShowQRScanner(false);
          setShowManualAttendance(false);
          setShowManageEvents(false);
          setShowMyQRID(false);
          setShowAttendanceTransparency(false);
          setShowAnnouncements(false);
          setShowAccessLogs(false);
          setShowSystemTools(false);
          setShowFeedbackPage(false);
          setShowTabangTaBaiPage(false);
          setShowMyProfile(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onLoginClick={() => {
          setShowLoginPanel(true);
          setIsSidebarOpen(false);
        }}
        logoUrl={logoError ? fallbackLogoUrl : primaryLogoUrl}
      />

      {/* Top Controls when logged in */}
      {isAdmin && (
        <>
          {/* Hamburger - Fixed Top LEFT (Mobile Only) - Hide when sidebar is open */}
          {!isSidebarOpen && (
            <div className="md:hidden fixed top-4 left-4 z-50">
              <AnimatedHamburger
                isOpen={isSidebarOpen}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                isDark={isDark}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-800"
              />
            </div>
          )}

          {/* Theme Toggle - Fixed Top RIGHT (Mobile Only) - Hide when sidebar is open */}
          {!isSidebarOpen && (
            <div className="md:hidden fixed top-4 right-4 z-50">
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-gray-900 transition-all shadow-lg border border-gray-200 dark:border-gray-800"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          )}
        </>
      )}

      {/* Main Content - Adjusted for sidebar when logged in */}
      <div className={`relative transition-all duration-300 ${isAdmin ? 'md:pl-[60px]' : ''}`} style={{ zIndex: (modalProject || showFounderModal || showDeveloperModal) ? 0 : 10 }}>
        {/* Edit Homepage Controls - Fixed Position */}
        {(userRole === 'admin' || userRole === 'auditor') && !isEditingHomepage && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleStartEditing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl shadow-lg"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              <Edit3 className="w-5 h-5" />
              Edit Homepage
            </button>
          </div>
        )}

        {/* Save/Cancel Controls - Fixed Position */}
        {isEditingHomepage && (
          <div className="fixed bottom-6 right-6 z-50 flex gap-3">
            <button
              onClick={handleCancelEditing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl shadow-lg"
              style={{
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={handleSaveEditing}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl shadow-lg"
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section
          id="home"
          className={`text-center pb-12 md:pb-20 px-4 md:px-6 relative transition-all duration-300 ${isAdmin ? 'pt-24 md:pt-28' : 'pt-28 md:pt-32'}`}
        >
          <div className="max-w-6xl mx-auto">
            {isEditingHomepage ? (
              // Edit Mode - Hero Section
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 text-left">Main Heading</label>
                  <input
                    type="text"
                    value={editedContent.hero.mainHeading}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        hero: { ...editedContent.hero, mainHeading: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      fontFamily: "var(--font-headings)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "1.5rem",
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 text-left">Sub Heading</label>
                  <input
                    type="text"
                    value={editedContent.hero.subHeading}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        hero: { ...editedContent.hero, subHeading: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      fontFamily: "var(--font-headings)",
                      fontWeight: "600",
                      fontSize: "1.25rem",
                    }}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 text-left">Tagline</label>
                  <textarea
                    value={editedContent.hero.tagline}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        hero: { ...editedContent.hero, tagline: e.target.value },
                      })
                    }
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </>
            ) : (
              // Display Mode - Hero Section
              <>
                <h1
                  className="text-center mb-2 px-4"
                  style={{
                    fontFamily: "var(--font-headings)",
                    fontWeight: "var(--font-weight-bold)",
                    color: !isLoadingContent ? "#f6421f" : undefined,
                    lineHeight: "1.1",
                    letterSpacing: "-0.02em",
                    fontSize: "clamp(1rem, 4.5vw, 3rem)",
                    maxWidth: "100%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "clip"
                  }}
                >
                  {isLoadingContent ? (
                    <TextShimmer as="span" className="leading-tight">
                      {homepageContent.hero?.mainHeading || "Welcome to Youth Service Philippines"}
                    </TextShimmer>
                  ) : (
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, #f6421f 0%, #ee8724 50%, #f6421f 100%)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        display: "inline-block",
                      }}
                    >
                      {homepageContent.hero.mainHeading}
                    </span>
                  )}
                </h1>
                <h2
                  className="text-center mb-4"
                  style={{
                    fontFamily: "var(--font-headings)",
                    fontWeight: "600",
                    color: !isLoadingContent ? "#ee8724" : undefined,
                    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                    lineHeight: "1.2"
                  }}
                >
                  {isLoadingContent ? (
                    <TextShimmer as="span" className="leading-snug">
                      {homepageContent.hero?.subHeading || "Tagum Chapter"}
                    </TextShimmer>
                  ) : (
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, #ee8724 0%, #f5c542 50%, #ee8724 100%)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        display: "inline-block",
                      }}
                    >
                      {homepageContent.hero.subHeading}
                    </span>
                  )}
                </h2>

                <p
                  className="text-lg md:text-xl mb-6 max-w-2xl mx-auto text-gray-600 dark:text-gray-400"
                  style={{ lineHeight: "1.5" }}
                >
                  {isLoadingContent ? (
                    <TextShimmer as="span" className="leading-relaxed">
                      {homepageContent.hero?.tagline || "Empowering youth to serve communities"}
                    </TextShimmer>
                  ) : (
                    homepageContent.hero.tagline
                  )}
                </p>
              </>
            )}

            {/* Button Group - Hide Login and Be a Member when logged in */}
            {!isAdmin && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                <button
                  onClick={() => setShowLoginPanel(true)}
                  className="w-full sm:w-44 h-12 px-6 rounded-xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #f6421f 0%, #ee8724 100%)",
                    fontWeight: "600",
                    fontSize: "16px",
                    boxShadow: "0 4px 12px rgba(246, 66, 31, 0.3)",
                  }}
                >
                  Log In
                </button>
                <button
                  className="w-full sm:w-44 h-12 px-5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex items-center justify-center"
                  style={{
                    color: "#f6421f",
                    border: "2px solid #f6421f",
                    background: "transparent",
                    fontWeight: "600",
                    fontSize: "16px",
                  }}
                >
                  Be a Member!
                </button>
              </div>
            )}

          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="max-w-6xl mx-auto px-4 md:px-6 mb-8 relative"
        >
          <div className="ysp-card p-6 md:p-8">
            {isEditingHomepage ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Section Title</label>
                  <input
                    type="text"
                    value={editedContent.about.title}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        about: { ...editedContent.about, title: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      fontFamily: "var(--font-headings)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "1.25rem",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Content</label>
                  <textarea
                    value={editedContent.about.content}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        about: { ...editedContent.about, content: e.target.value },
                      })
                    }
                    rows={8}
                    className="w-full px-4 py-3 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                {isLoadingContent ? (
                  <ShimmerContentCard isDark={isDark} isLoading={isLoadingContent} />
                ) : (
                  <>
                    <h2
                      className="mb-4"
                      style={{
                        fontFamily: "var(--font-headings)",
                        fontSize: "1.5rem",
                        fontWeight: "var(--font-weight-bold)",
                        color: "#f6421f",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {homepageContent.about?.title || "About YSP"}
                    </h2>

                    <p
                      className="text-justify text-gray-800 dark:text-gray-100"
                      style={{
                        fontSize: "1rem",
                        lineHeight: "1.625",
                        letterSpacing: "0.01em",
                        fontWeight: "500",
                      }}
                    >
                      {homepageContent.about?.content || ""}
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* Mission Section */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 mb-8 relative">
          <div className="ysp-card p-6 md:p-8">
            {isEditingHomepage ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Section Title</label>
                  <input
                    type="text"
                    value={editedContent.mission.title}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        mission: { ...editedContent.mission, title: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      fontFamily: "var(--font-headings)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "1.25rem",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Content</label>
                  <textarea
                    value={editedContent.mission.content}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        mission: { ...editedContent.mission, content: e.target.value },
                      })
                    }
                    rows={8}
                    className="w-full px-4 py-3 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                {isLoadingContent ? (
                  <ShimmerContentCard isDark={isDark} isLoading={isLoadingContent} />
                ) : (
                  <>
                    <h2
                      className="mb-4"
                      style={{
                        fontFamily: "var(--font-headings)",
                        fontSize: "1.5rem",
                        fontWeight: "var(--font-weight-bold)",
                        color: "#f6421f",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {homepageContent.mission?.title || "Mission"}
                    </h2>
                    <p
                      className="text-justify text-gray-800 dark:text-gray-100"
                      style={{
                        fontSize: "1rem",
                        lineHeight: "1.625",
                        letterSpacing: "0.01em",
                        fontWeight: "500",
                      }}
                    >
                      {homepageContent.mission?.content || ""}
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* Vision Section */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 mb-8 relative">
          <div className="ysp-card p-6 md:p-8">
            {isEditingHomepage ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Section Title</label>
                  <input
                    type="text"
                    value={editedContent.vision.title}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        vision: { ...editedContent.vision, title: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      fontFamily: "var(--font-headings)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "1.25rem",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Content</label>
                  <textarea
                    value={editedContent.vision.content}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        vision: { ...editedContent.vision, content: e.target.value },
                      })
                    }
                    rows={8}
                    className="w-full px-4 py-3 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                {isLoadingContent ? (
                  <ShimmerContentCard isDark={isDark} isLoading={isLoadingContent} />
                ) : (
                  <>
                    <h2
                      className="mb-4"
                      style={{
                        fontFamily: "var(--font-headings)",
                        fontSize: "1.5rem",
                        fontWeight: "var(--font-weight-bold)",
                        color: "#f6421f",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {homepageContent.vision?.title || "Vision"}
                    </h2>
                    <p
                      className="text-justify text-gray-800 dark:text-gray-100"
                      style={{
                        fontSize: "1rem",
                        lineHeight: "1.625",
                        letterSpacing: "0.01em",
                        fontWeight: "500",
                      }}
                    >
                      {homepageContent.vision?.content || ""}
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* Advocacy Pillars Section */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 mb-8 relative">
          <div className="ysp-card p-6 md:p-8">
            {isEditingHomepage ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Section Title</label>
                  <input
                    type="text"
                    value={editedContent.advocacyPillars.title}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        advocacyPillars: { ...editedContent.advocacyPillars, title: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    style={{
                      fontFamily: "var(--font-headings)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "1.25rem",
                    }}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Introduction Text</label>
                  <textarea
                    value={editedContent.advocacyPillars.intro}
                    onChange={(e) =>
                      setEditedContent({
                        ...editedContent,
                        advocacyPillars: { ...editedContent.advocacyPillars, intro: e.target.value },
                      })
                    }
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm text-gray-600 dark:text-gray-400">Pillars</label>
                  {editedContent.advocacyPillars.pillars.map((pillar, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="mb-2">
                        <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Label</label>
                        <input
                          type="text"
                          value={pillar.label}
                          onChange={(e) => {
                            const newPillars = [...editedContent.advocacyPillars.pillars];
                            newPillars[index].label = e.target.value;
                            setEditedContent({
                              ...editedContent,
                              advocacyPillars: { ...editedContent.advocacyPillars, pillars: newPillars },
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-500 mb-1">Description</label>
                        <textarea
                          value={pillar.description}
                          onChange={(e) => {
                            const newPillars = [...editedContent.advocacyPillars.pillars];
                            newPillars[index].description = e.target.value;
                            setEditedContent({
                              ...editedContent,
                              advocacyPillars: { ...editedContent.advocacyPillars, pillars: newPillars },
                            });
                          }}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2
                  className="mb-4"
                  style={{
                    fontFamily: "var(--font-headings)",
                    fontSize: "1.5rem",
                    fontWeight: "var(--font-weight-bold)",
                    color: "#f6421f",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {homepageContent.advocacyPillars?.title || "Advocacy Pillars"}
                </h2>
                {(() => {
                  // Parse the intro text to extract numbered items
                  const fullText = homepageContent.advocacyPillars?.intro || '';

                  // Split by numbered pattern (1.), (2.), etc.
                  const items = fullText.split('1.)').map(item => item.trim()).filter(item => item.length > 0);

                  return items.length > 0 ? (
                    <ol className="list-decimal list-outside ml-6 pl-2 space-y-4 text-gray-800 dark:text-gray-100" style={{ fontSize: "1rem", lineHeight: "1.7", fontWeight: 500 }}>
                      {items.map((item: string, idx: number) => (
                        <li key={idx} className="text-justify pl-2">
                          {item}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-justify text-gray-800 dark:text-gray-100" style={{ fontSize: "1rem", lineHeight: "1.7", fontWeight: 500 }}>
                      {fullText}
                    </p>
                  );
                })()}
              </>
            )}
          </div>
        </section>

        {/* Projects Section */}
        <section
          id="projects"
          className="max-w-6xl mx-auto px-4 md:px-6 mb-8 relative"
        >
          <div className="ysp-card p-6 md:p-8">
            <h2
              className="mb-6"
              style={{
                fontFamily: "var(--font-headings)",
                fontSize: "1.5rem",
                fontWeight: "var(--font-weight-bold)",
                color: "#f6421f",
                letterSpacing: "-0.01em",
              }}
            >
              Projects Implemented
            </h2>

            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex gap-3 mb-6 flex-wrap">
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  <Upload className="w-4 h-4" />
                  Upload Project
                </button>
                <button
                  onClick={() => {
                    if (projects.length === 0) {
                      toast.error('No projects to delete');
                      return;
                    }
                    setProjectDeleteMode(!projectDeleteMode);
                    if (!projectDeleteMode) {
                      toast.info('Click the X on any project to delete it');
                    }
                  }}
                  className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background: projectDeleteMode
                      ? "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)"
                      : "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  {projectDeleteMode ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  {projectDeleteMode ? 'Cancel Delete' : 'Delete Selected'}
                </button>
              </div>
            )}

            {/* Projects Grid */}
            {isLoadingContent ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <GlowingCard
                    key={project.id}
                    isDark={isDark}
                    glowOnHover={true}
                    className="overflow-hidden cursor-pointer transition-all duration-250 hover:scale-[1.03] relative"
                  >
                    {/* Delete Button (shown in delete mode) */}
                    {projectDeleteMode && isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const projectNum = project.number || project.id;
                          toast.warning(`Delete "${project.title}"?`, {
                            description: 'This action cannot be undone.',
                            action: {
                              label: 'Delete',
                              onClick: () => {
                                // Call backend to delete project
                                fetch(import.meta.env.VITE_GAS_URL, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                  body: new URLSearchParams({
                                    action: 'deleteHomepageProject',
                                    idCode: userIdCode,
                                    projectNumber: projectNum.toString()
                                  })
                                })
                                  .then(res => res.json())
                                  .then(data => {
                                    if (data.success) {
                                      setProjects(projects.filter(p => p.id !== project.id));
                                      toast.success('Project deleted successfully');
                                    } else {
                                      toast.error(data.message || 'Failed to delete project');
                                    }
                                  })
                                  .catch((err) => {
                                    console.error('Delete project error:', err);
                                    toast.error('Failed to delete project');
                                  });
                              }
                            },
                            cancel: {
                              label: 'Cancel',
                              onClick: () => { }
                            }
                          });
                        }}
                        className="absolute top-2 right-2 z-10 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 backdrop-blur-md"
                        style={{
                          background: isDark
                            ? 'rgba(220, 38, 38, 0.9)'
                            : 'rgba(239, 68, 68, 0.95)',
                          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                        }}
                        aria-label="Delete project"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    )}
                    <div
                      onClick={() => openProjectModal(project)}
                      className="w-full"
                    >
                      <div className="w-full h-48 overflow-hidden relative">
                        <ImageWithFallback
                          src={project.imageUrl}
                          alt={project.title}
                          className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-110"
                        />
                      </div>

                      <div className="p-4">
                        <h3
                          className="mb-2 line-clamp-2"
                          style={{
                            fontFamily: "var(--font-headings)",
                            fontSize: "1.125rem",
                            fontWeight: "var(--font-weight-bold)",
                            color: "#f6421f",
                            lineHeight: "1.4",
                          }}
                        >
                          {project.title}
                        </h3>

                        <p
                          className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3"
                          style={{ lineHeight: "1.5" }}
                        >
                          {renderLinkifiedText(project.description)}
                        </p>
                      </div>
                    </div>
                  </GlowingCard>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Organizational Chart Section */}
        <section id="org-chart" className="max-w-6xl mx-auto px-4 md:px-6 mb-8 relative">
          <div className="ysp-card p-6 md:p-8">
            <h2
              className="mb-6 flex items-center gap-3"
              style={{
                fontFamily: "var(--font-headings)",
                fontSize: "1.5rem",
                fontWeight: "var(--font-weight-bold)",
                color: "#f6421f",
                letterSpacing: "-0.01em",
              }}
            >
              <Network className="w-6 h-6" style={{ color: "#f6421f" }} />
              Organizational Chart
            </h2>

            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex gap-3 mb-6 flex-wrap">
                <button
                  onClick={() => setShowUploadChart(true)}
                  className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  <Upload className="w-4 h-4" />
                  Upload Chart
                </button>
                <button
                  onClick={() => {
                    if (!orgChartUrl) {
                      toast.error('No chart to delete');
                      return;
                    }
                    toast.warning('Delete Organizational Chart?', {
                      description: 'This action cannot be undone.',
                      action: {
                        label: 'Delete',
                        onClick: () => {
                          // Call backend to delete chart
                          fetch(import.meta.env.VITE_GAS_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                              action: 'deleteOrgChart',
                              idCode: userIdCode
                            })
                          })
                            .then(res => res.json())
                            .then(data => {
                              if (data.success) {
                                setOrgChartUrl('');
                                toast.success('Chart deleted successfully');
                              } else {
                                toast.error(data.message || 'Failed to delete chart');
                              }
                            })
                            .catch((err) => {
                              console.error('Delete chart error:', err);
                              toast.error('Failed to delete chart');
                            });
                        }
                      },
                      cancel: {
                        label: 'Cancel',
                        onClick: () => { }
                      }
                    });
                  }}
                  className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Chart
                </button>
              </div>
            )}

            {/* Founder Information - Clickable */}
            <button
              onClick={() => setShowFounderModal(true)}
              className="w-full mb-6 p-4 md:p-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer active:scale-[0.98] text-left"
            >
              <h3
                className="mb-2"
                style={{
                  fontFamily: "var(--font-headings)",
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#f6421f",
                }}
              >
                Founder
              </h3>
              <p
                className="text-gray-900 dark:text-white"
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                }}
              >
                Juanquine Carlo R. Castro
              </p>
              <p
                className="text-gray-800 dark:text-gray-100 mt-1"
                style={{
                  fontSize: "0.875rem",
                  fontStyle: "italic",
                  fontWeight: "500",
                }}
              >
                a.k.a Wacky Racho
              </p>
              <p
                className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2"
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "500",
                }}
              >
                <ExternalLink className="w-3 h-3" />
                Click to view full profile
              </p>
            </button>

            {/* Chart Display with Zoom Indicator */}
            {isLoadingContent ? (
              <div className="relative rounded-xl overflow-hidden">
                <div className="w-full h-[500px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />
              </div>
            ) : (
              <div
                className="relative cursor-pointer rounded-xl overflow-hidden group"
                onClick={() => {
                  if (orgChartUrl) {
                    setModalProject({
                      id: 0,
                      title: "Organizational Chart",
                      description: "Youth Service Philippines - Tagum Chapter organizational structure",
                      imageUrl: orgChartUrl,
                      link: '',
                      linkText: ''
                    });
                  }
                }}
              >
                <ImageWithFallback
                  src={orgChartUrl || primaryLogoUrl}
                  alt="Organizational Chart"
                  className="w-full h-auto rounded-lg shadow-lg transition-opacity duration-250 group-hover:opacity-90"
                />

                {/* Zoom Indicator */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4 text-white" />
                  <span
                    className="text-sm text-white"
                    style={{ fontWeight: "500" }}
                  >
                    Click to expand
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Contact Section (Dynamic) */}
        <section
          id="contact"
          className="max-w-6xl mx-auto px-4 md:px-6 mb-8 pb-8 relative"
        >
          <div className="ysp-card p-6 md:p-8">
            <h2
              className="mb-6"
              style={{
                fontFamily: "var(--font-headings)",
                fontSize: "1.5rem",
                fontWeight: "var(--font-weight-bold)",
                color: "#f6421f",
                letterSpacing: "-0.01em",
              }}
            >
              {homepageContent.contact?.title || 'Get in Touch'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Card */}
              {homepageContent.contact?.emailHref && (
                <a
                  href={homepageContent.contact.emailHref}
                  className="flex items-center gap-4 p-4 md:p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <div className="shrink-0">
                    <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-gray-900 dark:text-white mb-1"
                      style={{ fontSize: "16px", fontWeight: "500" }}
                    >
                      Email
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                      {homepageContent.contact?.email || 'N/A'}
                    </p>
                  </div>
                </a>
              )}

              {/* Phone Card */}
              {homepageContent.contact?.phoneHref && (
                <a
                  href={homepageContent.contact.phoneHref}
                  className="flex items-center gap-4 p-4 md:p-5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <div className="shrink-0">
                    <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-gray-900 dark:text-white mb-1"
                      style={{ fontSize: "16px", fontWeight: "500" }}
                    >
                      Phone
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {homepageContent.contact?.phone || 'N/A'}
                    </p>
                  </div>
                </a>
              )}

              {/* Location Card */}
              {(homepageContent.contact?.locationLink || homepageContent.contact?.location) && (
                <a
                  href={homepageContent.contact.locationLink || undefined}
                  target={homepageContent.contact.locationLink ? '_blank' : undefined}
                  rel={homepageContent.contact.locationLink ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-4 p-4 md:p-5 bg-orange-50 dark:bg-yellow-900/20 border border-orange-100 dark:border-yellow-800 rounded-xl transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <div className="shrink-0">
                    <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-gray-900 dark:text-white mb-1"
                      style={{ fontSize: "16px", fontWeight: "500" }}
                    >
                      Location
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {homepageContent.contact?.location || 'Location unavailable'}
                    </p>
                  </div>
                </a>
              )}

              {/* Social Cards - render one card per populated social link */}
              {(homepageContent.contact?.socialLinks && homepageContent.contact.socialLinks.length > 0) ? (
                homepageContent.contact.socialLinks
                  .filter((s: any) => String(s.platform || '').toLowerCase() !== 'partner')
                  .map((s: any) => {
                    const platform = String(s.platform || '').toLowerCase();
                    // icon selection
                    const iconProps = { className: 'w-6 h-6' };
                    let Icon = Globe;
                    let iconColor = 'text-gray-700 dark:text-gray-300';
                    let label = platform.charAt(0).toUpperCase() + platform.slice(1);

                    switch (platform) {
                      case 'facebook':
                        Icon = Facebook; iconColor = 'text-blue-600 dark:text-blue-400'; label = 'Facebook'; break;
                      case 'instagram':
                        Icon = Instagram; iconColor = 'text-pink-500 dark:text-pink-400'; label = 'Instagram'; break;
                      case 'twitter':
                        Icon = Twitter; iconColor = 'text-sky-500 dark:text-sky-400'; label = 'Twitter'; break;
                      case 'linkedin':
                        Icon = Linkedin; iconColor = 'text-blue-700 dark:text-blue-400'; label = 'LinkedIn'; break;
                      case 'youtube':
                        Icon = Youtube; iconColor = 'text-red-600 dark:text-red-400'; label = 'YouTube'; break;
                      case 'tiktok':
                        Icon = Music; iconColor = 'text-black dark:text-white'; label = 'TikTok'; break;
                      default:
                        Icon = Globe; iconColor = 'text-gray-700 dark:text-gray-300'; label = platform.charAt(0).toUpperCase() + platform.slice(1);
                    }

                    // Get platform-specific text
                    let actionText = 'Visit our page';
                    switch (platform) {
                      case 'youtube':
                        actionText = 'Visit our channel';
                        break;
                      default:
                        actionText = 'Visit our page';
                    }

                    return (
                      <a
                        key={s.platform}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-4 p-4 md:p-5 border rounded-xl transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.98] ${platform === 'facebook' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' :
                            platform === 'instagram' ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-100 dark:border-pink-800' :
                              platform === 'twitter' ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800' :
                                platform === 'linkedin' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' :
                                  platform === 'youtube' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' :
                                    platform === 'tiktok' ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-800' :
                                      'bg-gray-50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-800'
                          }`}
                      >
                        <div className="shrink-0">
                          <Icon className={`w-6 h-6 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-gray-900 dark:text-white mb-1"
                            style={{ fontSize: '16px', fontWeight: 500 }}
                          >
                            {label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {actionText}
                          </p>
                        </div>
                      </a>
                    );
                  })
              ) : (
                // Fallback to legacy single social link card
                homepageContent.contact?.socialLink && (
                  <a
                    href={homepageContent.contact.socialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 md:p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.98]"
                  >
                    <div className="shrink-0">
                      <Globe className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-gray-900 dark:text-white mb-1"
                        style={{ fontSize: "16px", fontWeight: "500" }}
                      >
                        {homepageContent.contact?.socialLabel}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {homepageContent.contact?.socialText || 'Visit our page'}
                      </p>
                    </div>
                  </a>
                )
              )}
            </div>

            {/* Partner with Us Button */}
            {homepageContent.contact?.partnerButtonLink && (
              <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl text-center">
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: "var(--font-headings)",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#f6421f",
                  }}
                >
                  {homepageContent.contact?.partnerTitle}
                </h3>
                <p
                  className="text-sm text-gray-800 dark:text-gray-100 mb-4 max-w-xl mx-auto"
                  style={{ fontWeight: "500" }}
                >
                  {homepageContent.contact?.partnerDescription || 'Join us in making a difference in our community. Partner with YSP and help us create lasting impact through collaborative projects.'}
                </p>
                <button
                  onClick={() => {
                    if (homepageContent.contact.partnerButtonLink) {
                      window.open(homepageContent.contact.partnerButtonLink, '_blank');
                    } else {
                      toast.error('No Partnership Applications ongoing');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(135deg, #f6421f 0%, #ee8724 50%, #fbcb29 100%)",
                    fontFamily: "var(--font-headings)",
                    fontWeight: "600",
                    fontSize: "1.125rem",
                    boxShadow: "0 4px 16px rgba(246, 66, 31, 0.4)",
                  }}
                >
                  <Globe className="w-5 h-5" />
                  {homepageContent.contact?.partnerButtonText || 'Partner with Us'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Developer Info Section */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 mb-8 pb-8 relative">
          <div
            className="ysp-card p-6 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-800"
            style={{
              boxShadow:
                "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                style={{
                  fontFamily: "var(--font-headings)",
                  fontSize: "1.125rem",
                  fontWeight: "500",
                  color: "#f6421f",
                  letterSpacing: "-0.01em",
                }}
              >
                Developer Info
              </h3>
              <button
                onClick={() => setShowDeveloperModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-300 hover:shadow-md active:scale-95"
                style={{
                  color: "#3b82f6",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                }}
                aria-label="View full developer profile"
              >
                <Plus className="w-4 h-4" />
                <span>View Full Profile</span>
              </button>
            </div>

            <div className="space-y-2">
              <p
                className="text-gray-900 dark:text-white"
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                }}
              >
                {developers[0]?.name || ''}
              </p>
              <p
                className="text-gray-800 dark:text-gray-100"
                style={{ fontSize: "1rem", fontWeight: "500" }}
              >
                {developers[0]?.position || ''}
              </p>
              <p
                className="text-gray-800 dark:text-gray-100"
                style={{ fontSize: "1rem", fontWeight: "500" }}
              >
                {developers[0]?.organization || ''}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                <p
                  className="text-sm text-gray-700 dark:text-gray-200 text-justify"
                  style={{
                    lineHeight: "1.625",
                    letterSpacing: "0.01em",
                    fontWeight: "500",
                  }}
                >
                  Should you encounter any issues, errors, or
                  technical difficulties while using this Web App,
                  please do not hesitate to reach out to us. You
                  may contact our support team through our
                  official{" "}
                  <a
                    href="https://www.facebook.com/YSPTagumChapter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                    style={{ fontWeight: "500" }}
                  >
                    Facebook Page
                  </a>{" "}
                  or send us an Email:{" "}
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=YSPTagumChapter@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f6421f] dark:text-[#ee8724] hover:underline transition-colors"
                    style={{ fontWeight: "500" }}
                  >
                    YSPTagumChapter@gmail.com
                  </a>{" "}
                  for further assistance. We value your feedback
                  and will address your concerns as promptly as
                  possible to ensure a smooth user experience.
                </p>
              </div>

              {/* Support Section */}
              <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600 text-center">
                <p
                  className="text-sm text-gray-700 dark:text-gray-200 mb-4"
                  style={{ fontWeight: "500" }}
                >
                  Support our campaigns and help transform lives in our community.
                  "Tabang ta bai" - Let's help each other!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={() => setShowTabangTaBaiPage(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(135deg, #f6421f 0%, #ee8724 100%)",
                      fontWeight: "700",
                      fontSize: "1rem",
                      boxShadow:
                        "0 4px 12px rgba(246, 66, 31, 0.4)",
                    }}
                  >
                    <HandHeart className="w-5 h-5" />
                    Tabang ta Bai (Campaigns)
                  </button>
                  <button
                    onClick={() => setShowFeedbackPage(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:scale-105"
                    style={{
                      background: "transparent",
                      border: "2px solid #ee8724",
                      color: "#ee8724",
                      fontWeight: "600",
                      fontSize: "1rem",
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Share Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 relative">
          <div className="max-w-6xl mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
            <p>
              &copy; 2025 Youth Service Philippines - Tagum
              Chapter. All rights reserved.
            </p>
            <p className="mt-2">
              Empowering Filipino youth to serve and lead.
            </p>
          </div>
        </footer>
      </div>
      {/* End Main Content Wrapper */}

      {/* Project Modal */}
      {modalProject && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div
            className={`relative w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark
                ? 'bg-gray-900 border border-gray-700'
                : 'bg-white border border-gray-200'
              }`}
            style={{
              maxWidth: '42rem',
              scrollbarWidth: 'thin',
              scrollbarColor: isDark ? '#4B5563 #1F2937' : '#D1D5DB #F3F4F6'
            }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
              <h2
                style={{
                  fontFamily: 'var(--font-headings)',
                  fontSize: '1.5rem',
                  fontWeight: 'var(--font-weight-bold)',
                  color: '#f6421f',
                  letterSpacing: '-0.01em',
                }}
              >
                {modalProject.title}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Project Image */}
              <div className="w-full overflow-hidden rounded-xl">
                <ImageWithFallback
                  src={modalProject.imageUrl}
                  alt={modalProject.title}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Project Description */}
              <div className="space-y-4">
                <div
                  className="text-gray-800 dark:text-gray-100 text-justify"
                  style={{ fontSize: '1rem', lineHeight: '1.625', fontWeight: '500' }}
                >
                  {renderLinkifiedText(modalProject.description)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {modalProject.link && (
                  <a
                    href={modalProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex-1 text-base group"
                    style={{
                      background: "linear-gradient(135deg, #f6421f 0%, #ee8724 100%)",
                      fontWeight: "600",
                      boxShadow: "0 4px 12px rgba(246, 66, 31, 0.3)",
                    }}
                  >
                    <ExternalLink className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    {modalProject.linkText || 'Learn More'}
                  </a>
                )}
                <button
                  onClick={closeModal}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex-1 text-base"
                  style={{
                    borderColor: "#f6421f",
                    color: "#f6421f",
                    fontWeight: "600",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Founder Modal */}
      <FounderModal
        isOpen={showFounderModal}
        onClose={() => setShowFounderModal(false)}
        isDark={isDark}
        isAdmin={isAdmin}
        userIdCode={userIdCode}
        onDataUpdated={loadHomepageContent}
        founderData={founders[0]}
      />

      {/* Developer Modal */}
      <DeveloperModal
        isOpen={showDeveloperModal}
        onClose={() => setShowDeveloperModal(false)}
        isDark={isDark}
        isAdmin={isAdmin}
        userIdCode={userIdCode}
        onDataUpdated={loadHomepageContent}
        developerData={developers[0]}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        isDark={isDark}
        userIdCode={userIdCode}
        onProjectCreated={async () => {
          // Reload homepage content to get new project
          const data = await getHomepageContentFromGAS();
          if (data?.success && data.content.projects) {
            setProjects(data.content.projects.map((p: any) => ({
              id: p.id || p.title,
              title: p.title || '',
              description: p.description || '',
              imageUrl: p.image || 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80',
              link: p.link || '',
              linkText: p.linkText || 'Learn More'
            })));
          }
        }}
      />

      {/* Upload Chart Modal */}
      <UploadChartModal
        isOpen={showUploadChart}
        onClose={() => setShowUploadChart(false)}
        isDark={isDark}
        userIdCode={userIdCode}
        onChartUploaded={async () => {
          // Reload homepage content to get new chart
          const data = await getHomepageContentFromGAS();
          if (data?.success && data.content.orgChartUrl) {
            setOrgChartUrl(data.content.orgChartUrl);
          }
        }}
      />

      {/* Login Panel */}
      <LoginPanel
        isOpen={showLoginPanel}
        onClose={() => setShowLoginPanel(false)}
        onLogin={handleLogin}
        isDark={isDark}
      />
    </div>
  );
}
