/**
 * =============================================================================
 * QR ATTENDANCE SCANNER PAGE
 * =============================================================================
 * 
 * SMART SPEC COMPLIANCE:
 * ✅ Uses PageLayout master component
 * ✅ Event select: 44px dropdown height
 * ✅ Time type toggle: proper button sizing
 * ✅ Camera preview: 16:9 aspect ratio
 * ✅ Toast notifications for scan results
 * 
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { PageLayout, DESIGN_TOKENS, getGlassStyle } from "./design-system";
import CustomDropdown from "./CustomDropdown";
import { Camera, StopCircle, QrCode, CheckCircle } from "lucide-react";

interface QRScannerPageProps {
  onClose: () => void;
  isDark: boolean;
}

export default function QRScannerPage({ onClose, isDark }: QRScannerPageProps) {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [timeType, setTimeType] = useState<"in" | "out">("in");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");

  const [events, setEvents] = useState<any[]>([]);

  // Fetch active events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { getEventsFromGAS } = await import("../services/gasApi");
        const result = await getEventsFromGAS();
        if (result.success && Array.isArray(result.events)) {
          // Filter for active events only if needed, or backend does it
          setEvents(result.events.filter((e: any) => e.status === 'Active'));
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isScanning) {
      const startScanning = async () => {
        try {
          // Wait for element to be available
          await new Promise(resolve => setTimeout(resolve, 100));
          
          html5QrCode = new Html5Qrcode("reader");
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
              // Success
              if (html5QrCode) {
                try {
                  await html5QrCode.stop();
                  html5QrCode.clear();
                } catch (e) {
                  console.error("Error stopping scanner", e);
                }
                setIsScanning(false);
              }
              
              toast.success("QR Code Scanned", { description: `ID: ${decodedText}` });
              
              try {
                const { recordAttendanceInGAS } = await import("../services/gasApi");
                // Pass timeType (in/out)
                const result = await recordAttendanceInGAS(decodedText, selectedEvent, timeType);
                
                if (result.success) {
                  toast.success("Attendance Recorded", { description: result.message });
                } else {
                  toast.error("Attendance Failed", { description: result.message });
                }
              } catch (error) {
                toast.error("Error recording attendance");
              }
            },
            (errorMessage) => {
              // Error (ignore for scanning loop)
            }
          );
          setCameraPermission("granted");
        } catch (err) {
          console.error(err);
          setCameraPermission("denied");
          setIsScanning(false);
          toast.error("Failed to start camera");
        }
      };
      startScanning();
    }

    return () => {
      if (html5QrCode) {
        html5QrCode.stop().catch(e => console.error("Error stopping scanner cleanup", e));
      }
    };
  }, [isScanning, selectedEvent]);

  const handleStartScanning = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event first");
      return;
    }
    setIsScanning(true);
  };

  const glassStyle = getGlassStyle(isDark);

  return (
    <PageLayout
      title="QR Attendance Scanner"
      subtitle="Scan member QR codes for quick attendance recording"
      isDark={isDark}
      onClose={onClose}
      breadcrumbs={[
        { label: "Home", onClick: onClose },
        { label: "Attendance Management", onClick: undefined },
        { label: "QR Scanner", onClick: undefined },
      ]}
    >
      {/* Controls Card */}
      <div
        className="border rounded-lg mb-6"
        style={{
          borderRadius: `${DESIGN_TOKENS.radius.card}px`,
          padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          ...glassStyle,
        }}
      >
        {/* Event Selector */}
        <div
          style={{
            marginBottom: `${DESIGN_TOKENS.spacing.scale.xl}px`,
          }}
        >
          <label
            className="block mb-2"
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.brand.orange,
            }}
          >
            Select Event (Active Events Only)
          </label>
          <CustomDropdown
            value={selectedEvent}
            onChange={setSelectedEvent}
            options={[
              { value: "", label: "Choose an active event..." },
              ...events.map((event) => ({
                value: event.id,
                label: event.name,
              }))
            ]}
            isDark={isDark}
            size="md"
          />
        </div>

        {/* Time Type Toggle */}
        <div
          style={{
            marginBottom: `${DESIGN_TOKENS.spacing.scale.xl}px`,
          }}
        >
          <label
            className="block mb-2"
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.body}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.brand.orange,
            }}
          >
            Time Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTimeType("in")}
              className={`px-6 py-3 rounded-lg transition-all ${timeType === "in"
                ? "text-white"
                : "border-2 hover:bg-white/30 dark:hover:bg-white/5"
                }`}
              style={{
                backgroundColor:
                  timeType === "in" ? DESIGN_TOKENS.colors.status.present : "transparent",
                borderColor:
                  timeType === "in"
                    ? "transparent"
                    : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                borderRadius: `${DESIGN_TOKENS.radius.button}px`,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.button}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
              }}
            >
              Time In
            </button>
            <button
              onClick={() => setTimeType("out")}
              className={`px-6 py-3 rounded-lg transition-all ${timeType === "out"
                ? "text-white"
                : "border-2 hover:bg-white/30 dark:hover:bg-white/5"
                }`}
              style={{
                backgroundColor:
                  timeType === "out" ? DESIGN_TOKENS.colors.status.late : "transparent",
                borderColor:
                  timeType === "out"
                    ? "transparent"
                    : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                borderRadius: `${DESIGN_TOKENS.radius.button}px`,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.button}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
              }}
            >
              Time Out
            </button>
          </div>
        </div>

        {/* Start Scanning Button */}
        <Button
          variant="primary"
          onClick={handleStartScanning}
          disabled={!selectedEvent || isScanning}
          loading={isScanning}
          icon={<Camera className="w-5 h-5" />}
          fullWidth
        >
          {isScanning ? "Scanning..." : "Start Camera"}
        </Button>
      </div>

      {/* Camera Preview */}
      <div
        className="border rounded-lg overflow-hidden relative"
        style={{
          borderRadius: `${DESIGN_TOKENS.radius.card}px`,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          ...glassStyle,
          aspectRatio: DESIGN_TOKENS.media.cameraPreview.aspectRatio,
        }}
      >
        {isScanning && <div id="reader" className="w-full h-full" />}
        
        {!isScanning && cameraPermission === "denied" && (
          <div className="w-full h-full flex items-center justify-center bg-red-500/10 absolute inset-0">
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <p
                className="text-red-500"
                style={{
                  fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                }}
              >
                Camera Access Denied
              </p>
              <p
                className="text-muted-foreground mt-2"
                style={{
                  fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                }}
              >
                Please enable camera permissions in your browser settings
              </p>
            </div>
          </div>
        )}
        
        {!isScanning && cameraPermission !== "denied" && (
          <div className="w-full h-full flex items-center justify-center absolute inset-0">
            <div className="text-center">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p
                className="text-muted-foreground"
                style={{
                  fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                }}
              >
                Select an event and click Start Camera
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div
        className="border rounded-lg mt-6"
        style={{
          borderRadius: `${DESIGN_TOKENS.radius.card}px`,
          padding: `${DESIGN_TOKENS.spacing.scale.lg}px`,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          ...glassStyle,
        }}
      >
        <div className="flex items-start gap-3">
          <CheckCircle
            className="flex-shrink-0 mt-1"
            style={{
              width: "20px",
              height: "20px",
              color: DESIGN_TOKENS.colors.status.present,
            }}
          />
          <div>
            <p
              style={{
                fontSize: `${DESIGN_TOKENS.typography.fontSize.caption}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.normal,
              }}
            >
              <strong>How to use:</strong> Select an event, choose Time In or Time
              Out, then click Start Camera. Position the member's QR ID within the
              frame for automatic scanning.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}