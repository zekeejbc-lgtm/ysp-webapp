/**
 * =============================================================================
 * ACCESS LOGS PAGE
 * =============================================================================
 * 
 * System access logs for admin monitoring
 * Features:
 * - View all user access logs
 * - Filter by date, user, action type
 * - Export logs
 * - Search functionality
 * 
 * Uses Design System Components
 * =============================================================================
 */

import { Download, Filter, AlertCircle, User, Clock, Shield } from "lucide-react";
import { useState } from "react";
import { PageLayout, Button, SearchInput, StatusChip, DESIGN_TOKENS } from "./design-system";
import { toast } from "sonner";

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  actionType: "login" | "logout" | "view" | "edit" | "create" | "delete";
  timestamp: string;
  ipAddress: string;
  device: string;
  status: "success" | "failed" | "warning";
}

interface AccessLogsPageProps {
  onClose: () => void;
  isDark: boolean;
}

export default function AccessLogsPage({
  onClose,
  isDark,
}: AccessLogsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [logs] = useState<AccessLog[]>([
    {
      id: "1",
      userId: "USR-001",
      userName: "Juan Dela Cruz",
      action: "Logged into system",
      actionType: "login",
      timestamp: "2025-02-15 14:30:22",
      ipAddress: "192.168.1.100",
      device: "Chrome on Windows",
      status: "success",
    },
    {
      id: "2",
      userId: "USR-002",
      userName: "Maria Santos",
      action: "Viewed Officer Directory",
      actionType: "view",
      timestamp: "2025-02-15 14:25:15",
      ipAddress: "192.168.1.101",
      device: "Safari on iPhone",
      status: "success",
    },
    {
      id: "3",
      userId: "USR-003",
      userName: "Pedro Reyes",
      action: "Failed login attempt",
      actionType: "login",
      timestamp: "2025-02-15 14:20:45",
      ipAddress: "192.168.1.102",
      device: "Firefox on Mac",
      status: "failed",
    },
    {
      id: "4",
      userId: "USR-001",
      userName: "Juan Dela Cruz",
      action: "Created new event",
      actionType: "create",
      timestamp: "2025-02-15 14:15:30",
      ipAddress: "192.168.1.100",
      device: "Chrome on Windows",
      status: "success",
    },
    {
      id: "5",
      userId: "USR-004",
      userName: "Ana Garcia",
      action: "Edited attendance record",
      actionType: "edit",
      timestamp: "2025-02-15 14:10:12",
      ipAddress: "192.168.1.103",
      device: "Edge on Windows",
      status: "success",
    },
    {
      id: "6",
      userId: "USR-002",
      userName: "Maria Santos",
      action: "Deleted announcement",
      actionType: "delete",
      timestamp: "2025-02-15 14:05:55",
      ipAddress: "192.168.1.101",
      device: "Safari on iPhone",
      status: "warning",
    },
    {
      id: "7",
      userId: "USR-005",
      userName: "Carlos Mendoza",
      action: "Logged out of system",
      actionType: "logout",
      timestamp: "2025-02-15 14:00:00",
      ipAddress: "192.168.1.104",
      device: "Chrome on Android",
      status: "success",
    },
  ]);

  const actionTypes = ["all", "login", "logout", "view", "edit", "create", "delete"];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "all" || log.actionType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleExport = () => {
    toast.success("Exporting logs...", {
      description: "Your log file will download shortly",
    });
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case "login":
        return <Shield className="w-4 h-4" />;
      case "logout":
        return <Shield className="w-4 h-4" />;
      case "view":
        return <AlertCircle className="w-4 h-4" />;
      case "edit":
        return <Filter className="w-4 h-4" />;
      case "create":
        return <Clock className="w-4 h-4" />;
      case "delete":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <PageLayout
      title="Access Logs"
      subtitle="Monitor system access and user activities"
      isDark={isDark}
      onClose={onClose}
      breadcrumbs={[
        { label: "Home", onClick: onClose },
        { label: "Logs & Reports", onClick: undefined },
        { label: "Access Logs", onClick: undefined },
      ]}
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search logs by user, action, or ID..."
            isDark={isDark}
          />
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleExport}
          icon={<Download className="w-4 h-4" />}
        >
          Export Logs
        </Button>
      </div>

      {/* Action Type Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {actionTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedType === type
                ? "bg-[#f6421f] text-white"
                : "bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10"
            }`}
            style={{
              fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
              transitionDuration: `${DESIGN_TOKENS.motion.duration.fast}ms`,
            }}
          >
            {type !== "all" && getActionTypeIcon(type)}
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Logs", value: logs.length.toString(), color: "#f6421f" },
          {
            label: "Successful",
            value: logs.filter((l) => l.status === "success").length.toString(),
            color: "#10b981",
          },
          {
            label: "Failed",
            value: logs.filter((l) => l.status === "failed").length.toString(),
            color: "#ef4444",
          },
          {
            label: "Warnings",
            value: logs.filter((l) => l.status === "warning").length.toString(),
            color: "#f59e0b",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="p-4 rounded-xl border"
            style={{
              background: isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(12px)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              className="mb-1"
              style={{
                fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                color: isDark ? "#9ca3af" : "#6b7280",
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h2}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className="border-b"
              style={{
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              }}
            >
              {["User", "Action", "Type", "Status", "Timestamp", "IP Address", "Device"].map(
                (header) => (
                  <th
                    key={header}
                    className="text-left px-4 py-3"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    No logs found
                  </p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                  style={{
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: DESIGN_TOKENS.colors.brand.orange + "20",
                        }}
                      >
                        <User className="w-4 h-4" style={{ color: DESIGN_TOKENS.colors.brand.orange }} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                            fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                          }}
                        >
                          {log.userName}
                        </div>
                        <div
                          style={{
                            fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                            color: isDark ? "#9ca3af" : "#6b7280",
                          }}
                        >
                          {log.userId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                    }}
                  >
                    {log.action}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getActionTypeIcon(log.actionType)}
                      <span
                        className="capitalize"
                        style={{
                          fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                        }}
                      >
                        {log.actionType}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={log.status} label={log.status} />
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    }}
                  >
                    {log.timestamp}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      fontFamily: "monospace",
                    }}
                  >
                    {log.ipAddress}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    {log.device}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageLayout>
  );
}
