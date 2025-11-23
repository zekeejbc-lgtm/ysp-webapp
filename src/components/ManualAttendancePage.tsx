import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageLayout, Button, DESIGN_TOKENS } from "./design-system";
import CustomDropdown from "./CustomDropdown";
import { AlertTriangle, Save, AlertCircle } from "lucide-react";

interface ManualAttendancePageProps {
  onClose: () => void;
  isDark: boolean;
}

export default function ManualAttendancePage({ onClose, isDark }: ManualAttendancePageProps) {
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [timeType, setTimeType] = useState<"in" | "out">("in");
  const [status, setStatus] = useState<"Present" | "Late" | "Excused" | "Absent">("Present");
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [previousRecord, setPreviousRecord] = useState<any>(null);

  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getEventsFromGAS, searchProfilesFromGAS } = await import("../services/gasApi");

        // Fetch Events
        const eventsResult = await getEventsFromGAS();
        if (eventsResult.success && Array.isArray(eventsResult.events)) {
          setEvents(eventsResult.events.filter((e: any) => e.status === 'Active'));
        }

        // Fetch Members
        const membersResult = await searchProfilesFromGAS('');
        if (membersResult.success && Array.isArray(membersResult.profiles)) {
          setMembers(membersResult.profiles.map((p: any) => ({
            id: p.idCode,
            name: p.fullName,
            committee: p.position // Using position as committee for now
          })));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleRecordAttendance = () => {
    if (!selectedMember || !selectedEvent) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check business rules
    if ((status === "Absent" || status === "Excused") && timeType === "out") {
      toast.error("Cannot record Time Out for Absent or Excused status");
      return;
    }

    // For now, skip overwrite check as backend handles it or we need a separate check API
    saveAttendance();
  };

  const saveAttendance = async () => {
    const member = members.find(m => m.id === selectedMember);

    try {
      const { recordManualAttendanceInGAS } = await import("../services/gasApi");
      const result = await recordManualAttendanceInGAS({
        idCode: selectedMember,
        eventId: selectedEvent,
        timeType: timeType,
        status: status,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        const timestamp = new Date().toLocaleTimeString("en-PH", {
          timeZone: "Asia/Manila",
          hour: "2-digit",
          minute: "2-digit"
        });

        toast.success("Attendance Recorded!", {
          description: `${member?.name} - ${status} - ${timeType === "in" ? "Time In" : "Time Out"} at ${timestamp}`,
        });

        // Reset form
        setSelectedMember("");
        setSelectedEvent("");
        setTimeType("in");
        setStatus("Present");
        setShowOverwriteModal(false);
      } else {
        toast.error("Failed to record attendance", { description: result.message });
      }
    } catch (error) {
      toast.error("Error recording attendance");
    }
  };

  return (
    <PageLayout
      title="Manual Attendance"
      subtitle="Record attendance manually for members"
      onClose={onClose}
      isDark={isDark}
      breadcrumbs={[
        { label: "Home", onClick: onClose },
        { label: "Attendance Management", onClick: undefined },
        { label: "Manual Attendance", onClick: undefined },
      ]}
    >
      {/* Form Card */}
      <div
        className="rounded-xl p-6 max-w-3xl mx-auto border"
        style={{
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Member Search */}
        <div className="mb-6">
          <label
            className="block mb-2"
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.brand.orange,
            }}
          >
            Select Member *
          </label>
          <CustomDropdown
            value={selectedMember}
            onChange={setSelectedMember}
            options={[
              { value: "", label: "Search and select member..." },
              ...members.map((member) => ({
                value: member.id,
                label: `${member.name} - ${member.committee}`,
              }))
            ]}
            isDark={isDark}
            size="md"
          />
        </div>

        {/* Event Search */}
        <div className="mb-6">
          <label
            className="block mb-2"
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.brand.orange,
            }}
          >
            Select Event (Active Events Only) *
          </label>
          <CustomDropdown
            value={selectedEvent}
            onChange={setSelectedEvent}
            options={[
              { value: "", label: "Search and select event..." },
              ...events.map((event) => ({
                value: event.id,
                label: event.name,
              }))
            ]}
            isDark={isDark}
            size="md"
          />
        </div>

        {/* Time Type */}
        <div className="mb-6">
          <label
            className="block mb-2"
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.brand.orange,
            }}
          >
            Time Type *
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setTimeType("in")}
              className={`flex-1 px-4 py-3 rounded-xl transition-all ${timeType === "in"
                ? "bg-[#f6421f] text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
            >
              Time In
            </button>
            <button
              onClick={() => setTimeType("out")}
              disabled={status === "Absent" || status === "Excused"}
              className={`flex-1 px-4 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${timeType === "out"
                ? "bg-[#f6421f] text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
            >
              Time Out
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <label
            className="block mb-2"
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.brand.orange,
            }}
          >
            Status *
          </label>
          <CustomDropdown
            value={status}
            onChange={(value) => setStatus(value as any)}
            options={[
              { value: "Present", label: "Present" },
              { value: "Late", label: "Late" },
              { value: "Excused", label: "Excused" },
              { value: "Absent", label: "Absent" },
            ]}
            isDark={isDark}
            size="md"
          />
        </div>

        {/* Business Rule Notice */}
        {(status === "Absent" || status === "Excused") && (
          <div className="mb-6 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Note:</strong> Time Out cannot be recorded for Absent or Excused status
            </span>
          </div>
        )}

        {/* Record Button */}
        <Button
          onClick={handleRecordAttendance}
          className="w-full px-6 py-4 rounded-xl text-white transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-3 bg-gradient-to-br from-[#f6421f] to-[#ee8724] font-semibold"
        >
          <Save className="w-5 h-5" />
          Record Attendance
        </Button>
      </div>

      {/* Overwrite Confirmation Modal */}
      {showOverwriteModal && previousRecord && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowOverwriteModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-md w-full border"
            style={{
              background: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="mb-4"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.red,
              }}
            >
              Overwrite Existing Record?
            </h3>

            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Previous Record:</p>
              <p style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.medium }}>{previousRecord.member}</p>
              <p className="text-sm">{previousRecord.event}</p>
              <p className="text-sm">{previousRecord.timeType} - {previousRecord.status}</p>
              <p className="text-sm text-muted-foreground">at {previousRecord.timestamp}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOverwriteModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
              >
                Cancel
              </button>
              <button
                onClick={saveAttendance}
                className="flex-1 px-4 py-3 rounded-xl text-white transition-colors"
                style={{
                  background: "linear-gradient(135deg, #f6421f 0%, #ee8724 100%)",
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                }}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}