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
          <li>Roles can be manually overridden in the table below.</li>
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
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">ID Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">Full Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user, idx) => (
                    <tr 
                      key={user.idCode} 
                      className={`border-b border-gray-200 dark:border-gray-700 ${
                        idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'
                      }`}
                    >
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                        {user.idCode}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                        {user.fullName}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editedRoles[user.idCode] || user.role}
                          onChange={(e) => handleRoleChange(user.idCode, e.target.value)}
                          className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f6421f] text-sm"
                          style={{
                            minWidth: '120px'
                          }}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Auditor">Auditor</option>
                          <option value="Head">Head</option>
                          <option value="Member">Member</option>
                          <option value="Banned">Banned</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Warning:</strong> Setting a role to <strong>"Banned"</strong> will immediately restrict that user's access to all features and API endpoints. Use with caution.
          </p>
        </div>
      </div>
    </div>
  );
}
