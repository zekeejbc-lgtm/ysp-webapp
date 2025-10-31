import { useState } from 'react';
import { 
  Home, ChevronDown, ChevronRight, Users, BarChart3, QrCode, 
  ClipboardList, Calendar, MessageSquare, FileText, ScrollText,
  User, LogOut, Wrench, Heart
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentUser: any;
  onLogout: () => void;
}

export default function Sidebar({ isOpen, currentPage, setCurrentPage, currentUser, onLogout }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (group: string) => {
    if (expandedGroups.includes(group)) {
      setExpandedGroups(expandedGroups.filter(g => g !== group));
    } else {
      setExpandedGroups([...expandedGroups, group]);
    }
  };

  const hasAccess = (allowedRoles: string[]) => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  const menuGroups = [
    {
      id: 'homepage',
      label: 'Homepage',
      icon: Home,
      page: 'homepage',
      roles: ['Admin', 'Head', 'Auditor', 'Member', 'Guest']
    },
    {
      id: 'donations',
      label: 'Donations',
      icon: Heart,
      page: 'donations',
      roles: ['Admin', 'Head', 'Auditor', 'Member', 'Guest']
    },
    {
      id: 'dashboard',
      label: 'Dashboard & Directory',
      icon: BarChart3,
      roles: ['Admin', 'Head', 'Auditor'],
      subItems: [
        { label: 'Officer Directory Search', page: 'officer-search', icon: Users },
        { label: 'Attendance Dashboard', page: 'attendance-dashboard', icon: BarChart3 }
      ]
    },
    {
      id: 'attendance',
      label: 'Attendance Management',
      icon: ClipboardList,
      roles: ['Admin', 'Head', 'Auditor', 'Member'],
      subItems: [
        { label: 'QR Attendance Scanner', page: 'qr-scanner', icon: QrCode, roles: ['Admin', 'Head', 'Auditor'] },
        { label: 'Manual Attendance', page: 'manual-attendance', icon: ClipboardList, roles: ['Admin', 'Head', 'Auditor'] },
  { label: 'Manage Events', page: 'manage-events', icon: Calendar, roles: ['Admin', 'Auditor'] },
        { label: 'My QR ID', page: 'my-qr-id', icon: QrCode, roles: ['Admin', 'Head', 'Auditor', 'Member'] },
        { label: 'Attendance Transparency', page: 'attendance-transparency', icon: FileText, roles: ['Admin', 'Head', 'Auditor', 'Member'] }
      ]
    },
    {
      id: 'communication',
      label: 'Communication Center',
      icon: MessageSquare,
      roles: ['Admin', 'Head', 'Auditor', 'Member', 'Guest'],
      subItems: [
        { label: 'Announcements', page: 'announcements', icon: MessageSquare, roles: ['Admin', 'Head', 'Auditor', 'Member'] },
        { label: 'Feedback', page: 'feedback', icon: FileText, roles: ['Admin', 'Head', 'Auditor', 'Member', 'Guest'] }
      ]
    },
    {
      id: 'logs',
      label: 'Logs & Reports',
      icon: ScrollText,
      roles: ['Auditor'],
      subItems: [
        { label: 'Access Logs', page: 'access-logs', icon: ScrollText, roles: ['Auditor'] },
        { label: 'System Tools', page: 'system-tools', icon: Wrench, roles: ['Auditor'] }
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-lg overflow-y-auto transition-all duration-250 z-40">
      <div className="p-4 space-y-2">
        {menuGroups.map((group) => {
          if (!hasAccess(group.roles)) return null;

          const isExpanded = expandedGroups.includes(group.id);
          const Icon = group.icon;

          if (!group.subItems) {
            return (
              <button
                key={group.id}
                onClick={() => setCurrentPage(group.page!)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  currentPage === group.page
                    ? 'bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span>{group.label}</span>
              </button>
            );
          }

          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span>{group.label}</span>
                </div>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isExpanded && (
                <div className="ml-4 space-y-1 animate-[slideDown_0.25s_ease]">
                  {group.subItems.map((subItem) => {
                    if ('roles' in subItem && subItem.roles && !hasAccess(subItem.roles)) return null;

                    const SubIcon = subItem.icon;
                    return (
                      <button
                        key={subItem.page}
                        onClick={() => setCurrentPage(subItem.page)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                          currentPage === subItem.page
                            ? 'bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <SubIcon size={18} />
                        <span className="text-sm">{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Personal Section */}
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {currentUser && currentUser.role !== 'Guest' && (
            <button
              onClick={() => setCurrentPage('my-profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentPage === 'my-profile'
                  ? 'bg-gradient-to-r from-[#f6421f] to-[#ee8724] text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <User size={20} />
              <span>My Profile</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
