/**
 * =============================================================================
 * ATTENDANCE TRANSPARENCY PAGE
 * =============================================================================
 * 
 * SMART SPEC COMPLIANCE:
 * ✅ Uses PageLayout master component
 * ✅ Table row height: 48px
 * ✅ StatusChip components for status display
 * ✅ Summary boxes with proper spacing
 * ✅ Glassmorphism cards
 * 
 * =============================================================================
 */

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { PageLayout, StatusChip, DESIGN_TOKENS, getGlassStyle } from "./design-system";

interface AttendanceRecord {
  date: string;
  event: string;
  timeIn: string;
  timeOut: string;
  status: "present" | "late" | "excused" | "absent";
}

interface AttendanceTransparencyPageProps {
  onClose: () => void;
  isDark: boolean;
  userName?: string;
}

export default function AttendanceTransparencyPage({
  onClose,
  isDark,
  userName = "Juan Dela Cruz",
}: AttendanceTransparencyPageProps) {
  const [sortBy, setSortBy] = useState<"date" | "event">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const attendanceRecords: AttendanceRecord[] = [
    {
      date: "2025-02-01",
      event: "Community Outreach 2025",
      timeIn: "09:00 AM",
      timeOut: "05:00 PM",
      status: "present",
    },
    {
      date: "2025-01-28",
      event: "Tree Planting Initiative",
      timeIn: "08:30 AM",
      timeOut: "12:30 PM",
      status: "present",
    },
    {
      date: "2025-01-25",
      event: "Leadership Training",
      timeIn: "10:15 AM",
      timeOut: "04:00 PM",
      status: "late",
    },
    {
      date: "2025-01-20",
      event: "Health Mission",
      timeIn: "N/A",
      timeOut: "N/A",
      status: "excused",
    },
    {
      date: "2025-01-15",
      event: "Youth Summit",
      timeIn: "N/A",
      timeOut: "N/A",
      status: "absent",
    },
    {
      date: "2025-01-10",
      event: "Environmental Conservation Drive",
      timeIn: "07:00 AM",
      timeOut: "01:00 PM",
      status: "present",
    },
    {
      date: "2025-01-05",
      event: "Disaster Response Training",
      timeIn: "09:30 AM",
      timeOut: "04:30 PM",
      status: "late",
    },
  ];

  const statusCounts = {
    present: attendanceRecords.filter((r) => r.status === "present").length,
    late: attendanceRecords.filter((r) => r.status === "late").length,
    excused: attendanceRecords.filter((r) => r.status === "excused").length,
    absent: attendanceRecords.filter((r) => r.status === "absent").length,
  };

  const totalEvents = attendanceRecords.length;
  const attendanceRate = Math.round(
    ((statusCounts.present + statusCounts.late) / totalEvents) * 100
  );

  const glassStyle = getGlassStyle(isDark);

  return (
    <PageLayout
      title="Attendance Transparency"
      subtitle={`Viewing attendance records for ${userName}`}
      isDark={isDark}
      onClose={onClose}
      breadcrumbs={[
        { label: "Home", onClick: onClose },
        { label: "Attendance Management", onClick: undefined },
        { label: "Attendance Transparency", onClick: undefined },
      ]}
    >
      {/* Summary Cards */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        style={{
          marginBottom: `${DESIGN_TOKENS.spacing.scale.xl}px`,
        }}
      >
        {/* Summary Stats */}
        <div
          className="border rounded-lg text-center"
          style={{
            borderRadius: `${DESIGN_TOKENS.radius.card}px`,
            padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
            ...glassStyle,
          }}
        >
          <div
            style={{
              fontSize: `${DESIGN_TOKENS.typography.fontSize.h1}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
              color: DESIGN_TOKENS.colors.status.present,
              marginBottom: `${DESIGN_TOKENS.spacing.scale.sm}px`,
            }}
          >
            {statusCounts.present}
          </div>
          <div
            className="text-muted-foreground"
            style={{
              fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            }}
          >
            Present
          </div>
        </div>

        <div
          className="border rounded-lg text-center"
          style={{
            borderRadius: `${DESIGN_TOKENS.radius.card}px`,
            padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
            ...glassStyle,
          }}
        >
          <div
            style={{
              fontSize: `${DESIGN_TOKENS.typography.fontSize.h1}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
              color: DESIGN_TOKENS.colors.status.late,
              marginBottom: `${DESIGN_TOKENS.spacing.scale.sm}px`,
            }}
          >
            {statusCounts.late}
          </div>
          <div
            className="text-muted-foreground"
            style={{
              fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            }}
          >
            Late
          </div>
        </div>

        <div
          className="border rounded-lg text-center"
          style={{
            borderRadius: `${DESIGN_TOKENS.radius.card}px`,
            padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
            ...glassStyle,
          }}
        >
          <div
            style={{
              fontSize: `${DESIGN_TOKENS.typography.fontSize.h1}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
              color: DESIGN_TOKENS.colors.status.excused,
              marginBottom: `${DESIGN_TOKENS.spacing.scale.sm}px`,
            }}
          >
            {statusCounts.excused}
          </div>
          <div
            className="text-muted-foreground"
            style={{
              fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            }}
          >
            Excused
          </div>
        </div>

        <div
          className="border rounded-lg text-center"
          style={{
            borderRadius: `${DESIGN_TOKENS.radius.card}px`,
            padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
            ...glassStyle,
          }}
        >
          <div
            style={{
              fontSize: `${DESIGN_TOKENS.typography.fontSize.h1}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
              color: DESIGN_TOKENS.colors.status.absent,
              marginBottom: `${DESIGN_TOKENS.spacing.scale.sm}px`,
            }}
          >
            {statusCounts.absent}
          </div>
          <div
            className="text-muted-foreground"
            style={{
              fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            }}
          >
            Absent
          </div>
        </div>
      </div>

      {/* Attendance Rate Banner */}
      <div
        className="border rounded-lg mb-6 text-center"
        style={{
          borderRadius: `${DESIGN_TOKENS.radius.card}px`,
          padding: `${DESIGN_TOKENS.spacing.scale.lg}px`,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          ...glassStyle,
          background:
            attendanceRate >= 80
              ? `rgba(16, 185, 129, 0.1)`
              : attendanceRate >= 60
              ? `rgba(245, 158, 11, 0.1)`
              : `rgba(239, 68, 68, 0.1)`,
        }}
      >
        <div
          style={{
            fontSize: `${DESIGN_TOKENS.typography.fontSize.h2}px`,
            fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
            color:
              attendanceRate >= 80
                ? DESIGN_TOKENS.colors.status.present
                : attendanceRate >= 60
                ? DESIGN_TOKENS.colors.status.late
                : DESIGN_TOKENS.colors.status.absent,
          }}
        >
          Overall Attendance Rate: {attendanceRate}%
        </div>
        <p
          className="text-muted-foreground"
          style={{
            fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
            marginTop: `${DESIGN_TOKENS.spacing.scale.xs}px`,
          }}
        >
          {totalEvents} total events tracked
        </p>
      </div>

      {/* Attendance Records Table */}
      <div
        className="border rounded-lg overflow-hidden"
        style={{
          borderRadius: `${DESIGN_TOKENS.radius.card}px`,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          ...glassStyle,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="border-b"
                style={{
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                  background: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.02)",
                }}
              >
                <th
                  className="text-left px-4"
                  style={{
                    height: `${DESIGN_TOKENS.table.rowHeight}px`,
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                  }}
                >
                  Date
                </th>
                <th
                  className="text-left px-4"
                  style={{
                    height: `${DESIGN_TOKENS.table.rowHeight}px`,
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                  }}
                >
                  Event Name
                </th>
                <th
                  className="text-left px-4"
                  style={{
                    height: `${DESIGN_TOKENS.table.rowHeight}px`,
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                  }}
                >
                  Time In
                </th>
                <th
                  className="text-left px-4"
                  style={{
                    height: `${DESIGN_TOKENS.table.rowHeight}px`,
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                  }}
                >
                  Time Out
                </th>
                <th
                  className="text-left px-4"
                  style={{
                    height: `${DESIGN_TOKENS.table.rowHeight}px`,
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
                  style={{
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.05)",
                    transitionDuration: `${DESIGN_TOKENS.motion.duration.fast}ms`,
                  }}
                >
                  <td
                    className="px-4"
                    style={{
                      height: `${DESIGN_TOKENS.table.rowHeight}px`,
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {record.date}
                    </div>
                  </td>
                  <td
                    className="px-4"
                    style={{
                      height: `${DESIGN_TOKENS.table.rowHeight}px`,
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                    }}
                  >
                    {record.event}
                  </td>
                  <td
                    className="px-4 text-muted-foreground"
                    style={{
                      height: `${DESIGN_TOKENS.table.rowHeight}px`,
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {record.timeIn}
                    </div>
                  </td>
                  <td
                    className="px-4 text-muted-foreground"
                    style={{
                      height: `${DESIGN_TOKENS.table.rowHeight}px`,
                      fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {record.timeOut}
                    </div>
                  </td>
                  <td
                    className="px-4"
                    style={{
                      height: `${DESIGN_TOKENS.table.rowHeight}px`,
                    }}
                  >
                    <StatusChip status={record.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
