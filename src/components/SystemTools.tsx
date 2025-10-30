import { useState, useEffect } from 'react';
import { systemAPI, roleManagementAPI, UserRoleInfo } from '../services/api';
import { toast } from 'sonner';
import { Wrench, RefreshCw, Clock, Users, Save, Loader2 } from 'lucide-react';

interface SystemToolsProps {
  currentUser: { id: string; role: string; username?: string };
}

export default function SystemTools({ currentUser }: SystemToolsProps) {
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<UserRoleInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editedRoles, setEditedRoles] = useState<{ [idCode: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const requireAuditor = () => {
    if (!currentUser || currentUser.role !== 'Auditor') {
      toast.error('Only the Auditor can perform this action.');
      return false;
    }
    return true;
  };

  // Load all users on component mount
  useEffect(() => {
    if (currentUser?.role === 'Auditor') {
      loadUsers();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    if (!requireAuditor()) return;
    try {
      setLoadingUsers(true);
      const res = await roleManagementAPI.getAllUsers(currentUser.id);
      if (res.success && res.users) {
        setUsers(res.users);
        // Initialize edited roles map
        const initialRoles: { [key: string]: string } = {};
        res.users.forEach(user => {
          initialRoles[user.idCode] = user.role;
        });
        setEditedRoles(initialRoles);
      } else {
        toast.error(res.message || 'Failed to load users');
      }
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRecalc = async () => {
    if (!requireAuditor()) return;
    try {
      setBusy(true);
      const res = await systemAPI.recalcAgesNow(currentUser.id);
      if (res.success) {
        toast.success(`Recalculated ages. Updated ${res.updated ?? 0} row(s).`);
      } else {
        toast.error(res.message || 'Failed to recalculate ages');
      }
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleInstallTrigger = async () => {
    if (!requireAuditor()) return;
    try {
      setBusy(true);
      const res = await systemAPI.installAgeRecalcTrigger(currentUser.id);
      if (res.success) {
        toast.success(res.message || 'Installed daily trigger');
      } else {
        toast.error(res.message || 'Failed to install trigger');
      }
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleAssignRoles = async () => {
    if (!requireAuditor()) return;
    try {
      setBusy(true);
      const res = await roleManagementAPI.assignRoles(currentUser.id);
      if (res.success) {
        toast.success(`Assigned roles. Updated ${res.updated ?? 0} user(s).`);
        // Reload users to show updated roles
        await loadUsers();
      } else {
        toast.error(res.message || 'Failed to assign roles');
      }
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = (idCode: string, newRole: string) => {
    setEditedRoles(prev => ({
      ...prev,
      [idCode]: newRole
    }));
  };

  const handleSaveChanges = async () => {
    if (!requireAuditor()) return;
    
    // Find changes
    const changes: Array<{ idCode: string; oldRole: string; newRole: string }> = [];
    users.forEach(user => {
      const newRole = editedRoles[user.idCode];
      if (newRole && newRole !== user.role) {
        changes.push({ idCode: user.idCode, oldRole: user.role, newRole });
      }
    });

    if (changes.length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      setSaving(true);
      let successCount = 0;
      let failCount = 0;

      for (const change of changes) {
        const res = await roleManagementAPI.updateUserRole(
          currentUser.id,
          change.idCode,
          change.newRole as any
        );
        if (res.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to update ${change.idCode}:`, res.message);
        }
      }

      if (successCount > 0) {
        toast.success(`Updated ${successCount} role(s) successfully`);
        await loadUsers(); // Reload to show updated data
      }
      if (failCount > 0) {
        toast.error(`Failed to update ${failCount} role(s)`);
      }
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* System Tools Section */}
      <div className="ysp-card">
        <h3 className="text-xl font-semibold text-[#f6421f] dark:text-[#ee8724] mb-2 flex items-center gap-2">
          <Wrench size={22} />
          System Tools (Auditor)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          These tools are restricted to the Auditor account. Actions call secured backend endpoints.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <button
            onClick={handleRecalc}
            disabled={busy}
            style={{
              background: busy ? '#9ca3af' : 'linear-gradient(90deg,#f6421f,#ee8724)',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1
            }}
          >
            <RefreshCw size={18} className={busy ? 'animate-spin' : ''} />
            <span>Recalculate All Ages</span>
          </button>
          <button
            onClick={handleInstallTrigger}
            disabled={busy}
            style={{
              backgroundColor: busy ? '#9ca3af' : '#374151',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }
            }}
            onMouseLeave={(e) => {
              if (!busy) {
                e.currentTarget.style.backgroundColor = '#374151';
              }
            }}
          >
            <Clock size={18} />
            <span>Install Daily Trigger</span>
          </button>
          <button
            onClick={handleAssignRoles}
            disabled={busy}
            style={{
              backgroundColor: busy ? '#9ca3af' : '#16a34a',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.backgroundColor = '#15803d';
              }
            }}
            onMouseLeave={(e) => {
              if (!busy) {
                e.currentTarget.style.backgroundColor = '#16a34a';
              }
            }}
          >
            <Users size={18} />
            <span>Assign Roles (Bulk)</span>
          </button>
        </div>
      </div>

      {/* Notes Section */}
      <div className="ysp-card">
        <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Notes</h4>
        <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Ages are computed from Date of Birth (Column E) and written to Column F.</li>
          <li>Trigger runs daily at 00:05 Asia/Manila.</li>
          <li>If dates don't parse, check that Column E contains real dates (Format → Number → Date).</li>
          <li><strong>Assign Roles (Bulk)</strong> syncs User Profiles with Officer Directory based on name matching.</li>
          <li><strong className="text-green-600 dark:text-green-400">Head</strong> and <strong className="text-red-600 dark:text-red-400">Banned</strong> roles are protected and will NOT be overridden by bulk assignment.</li>
          <li>Roles can be manually changed in the table below using the color-coded dropdown.</li>
        </ul>
      </div>

      {/* Role Management Section */}
      <div className="ysp-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-[#f6421f] dark:text-[#ee8724] flex items-center gap-2">
            <Users size={22} />
            User Role Management
          </h3>
          <button
            onClick={handleSaveChanges}
            disabled={saving || loadingUsers}
            style={{
              backgroundColor: saving ? '#9ca3af' : '#2563eb',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: 'none',
              cursor: saving || loadingUsers ? 'not-allowed' : 'pointer',
              opacity: saving || loadingUsers ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!saving && !loadingUsers) {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && !loadingUsers) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={32} className="animate-spin text-[#f6421f]" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{
                backgroundColor: isDarkMode ? '#374151' : '#f3f4f6'
              }}>
                <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}` }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{
                    color: isDarkMode ? '#ffffff' : '#111827'
                  }}>ID Code</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{
                    color: isDarkMode ? '#ffffff' : '#111827'
                  }}>Full Name</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{
                    color: isDarkMode ? '#ffffff' : '#111827'
                  }}>Role</th>
                </tr>
              </thead>
              <tbody style={{
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff'
              }}>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8" style={{
                      color: isDarkMode ? '#9ca3af' : '#6b7280'
                    }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const currentRole = editedRoles[user.idCode] || user.role;
                    return (
                      <tr 
                        key={user.idCode}
                        style={{
                          borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
                        }}
                      >
                        <td className="py-3 px-4 font-mono text-xs" style={{
                          color: isDarkMode ? '#f3f4f6' : '#374151'
                        }}>
                          {user.idCode}
                        </td>
                        <td className="py-3 px-4 font-medium" style={{
                          color: isDarkMode ? '#ffffff' : '#111827'
                        }}>
                          {user.fullName}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={currentRole}
                            onChange={(e) => handleRoleChange(user.idCode, e.target.value)}
                            style={{
                              minWidth: '130px',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.375rem',
                              border: isDarkMode ? '2px solid #4b5563' : '2px solid #d1d5db',
                              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              outline: 'none',
                              color: 
                                currentRole === 'Banned' ? (isDarkMode ? '#fca5a5' : '#dc2626') :
                                currentRole === 'Head' ? (isDarkMode ? '#86efac' : '#16a34a') :
                                currentRole === 'Admin' ? (isDarkMode ? '#fdba74' : '#ea580c') :
                                currentRole === 'Auditor' ? (isDarkMode ? '#93c5fd' : '#2563eb') :
                                (isDarkMode ? '#d1d5db' : '#6b7280')
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#f6421f';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(246, 66, 31, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <option value="Admin" style={{ 
                              color: isDarkMode ? '#fdba74' : '#ea580c',
                              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                              fontWeight: '600' 
                            }}>🟠 Admin</option>
                            <option value="Auditor" style={{ 
                              color: isDarkMode ? '#93c5fd' : '#2563eb',
                              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                              fontWeight: '600' 
                            }}>🔵 Auditor</option>
                            <option value="Head" style={{ 
                              color: isDarkMode ? '#86efac' : '#16a34a',
                              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                              fontWeight: '600' 
                            }}>🟢 Head</option>
                            <option value="Member" style={{ 
                              color: isDarkMode ? '#d1d5db' : '#6b7280',
                              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                              fontWeight: '600' 
                            }}>⚪ Member</option>
                            <option value="Banned" style={{ 
                              color: isDarkMode ? '#fca5a5' : '#dc2626',
                              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                              fontWeight: '600' 
                            }}>🔴 Banned</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Warning:</strong> Setting a role to <strong>"Banned"</strong> will immediately restrict that user's access to all features and API endpoints. Use with caution.
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>ℹ️ Note:</strong> The <strong>"Assign Roles (Bulk)"</strong> button will NOT override existing <strong className="text-green-600 dark:text-green-400">Head</strong> or <strong className="text-red-600 dark:text-red-400">Banned</strong> roles. These must be changed manually in the table above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
