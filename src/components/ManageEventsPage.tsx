import { useState, useEffect } from "react";
import { Plus, Edit, Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { PageLayout, Button, DESIGN_TOKENS, getGlassStyle } from "./design-system";

interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Inactive";
  locationName?: string;
  location: { lat: number; lng: number };
  radius: number;
}

interface ManageEventsPageProps {
  onClose: () => void;
  isDark: boolean;
}

export default function ManageEventsPage({ onClose, isDark }: ManageEventsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    locationName: "",
    lat: 7.4500,
    lng: 125.8078,
    radius: 100,
  });

  const [events, setEvents] = useState<Event[]>([]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { getEventsFromGAS } = await import("../services/gasApi");
        const result = await getEventsFromGAS();
        if (result.success && Array.isArray(result.events)) {
          setEvents(result.events.map((e: any) => ({
            id: e.id,
            name: e.name,
            description: "", // Backend doesn't return description yet
            startDate: e.date, // Backend returns date only
            endDate: e.date,
            status: e.status,
            location: { lat: 7.4500, lng: 125.8078 }, // Default location
            radius: 100
          })));
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (eventId: string) => {
    try {
      const { toggleEventStatusInGAS } = await import("../services/gasApi");
      const result = await toggleEventStatusInGAS(eventId, "");
      if (result.success) {
        setEvents((prev) =>
          prev.map((event) =>
            event.id === eventId
              ? { ...event, status: result.newStatus as "Active" | "Inactive" }
              : event
          )
        );
        toast.success("Event status updated");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  const handleCreateOrEdit = async () => {
    if (!formData.name || !formData.startDate) {
      toast.error("Please fill in required fields");
      return;
    }

    if (editingEvent) {
      toast.info("Editing events is not yet supported by the backend");
      return;
    }

    try {
      const { createEventInGAS } = await import("../services/gasApi");
      const result = await createEventInGAS({
        name: formData.name,
        date: formData.startDate
      });

      if (result.success && result.event) {
        const newEvent: Event = {
          id: result.event.id,
          name: result.event.name,
          description: formData.description,
          startDate: result.event.date,
          endDate: result.event.date,
          status: "Active",
          location: { lat: formData.lat, lng: formData.lng },
          radius: formData.radius,
        };
        setEvents((prev) => [...prev, newEvent]);
        toast.success("Event created successfully");
        setShowModal(false);
        resetForm();
      } else {
        toast.error("Failed to create event", { description: result.message });
      }
    } catch (error) {
      toast.error("Error creating event");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      locationName: "",
      lat: 7.4500,
      lng: 125.8078,
      radius: 100,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingEvent(null);
    setShowModal(true);
  };

  const openEditModal = (event: Event) => {
    setFormData({
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      locationName: event.locationName || "",
      lat: event.location.lat,
      lng: event.location.lng,
      radius: event.radius,
    });
    setEditingEvent(event);
    setShowModal(true);
  };

  return (
    <PageLayout
      title="Manage Events"
      subtitle="Create and manage attendance events with geofencing"
      onClose={onClose}
      isDark={isDark}
      breadcrumbs={[
        { label: "Home", onClick: onClose },
        { label: "Attendance Management", onClick: undefined },
        { label: "Manage Events", onClick: undefined },
      ]}
      actions={
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg text-white transition-all hover:shadow-lg flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #f6421f 0%, #ee8724 100%)",
            fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
          }}
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      }
    >
      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Event Name or ID..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
          style={{
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}
        />
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="rounded-xl p-6 border"
            style={{
              background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3
                  className="mb-1"
                  style={{
                    fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                    fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                    color: DESIGN_TOKENS.colors.brand.red,
                  }}
                >
                  {event.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {event.id}
                </p>
              </div>
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: event.status === "Active" ? "#10b98120" : "#6b728020",
                  color: event.status === "Active" ? "#10b981" : "#6b7280",
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                }}
              >
                {event.status}
              </span>
            </div>

            <p className="text-muted-foreground text-sm mb-3">
              {event.description}
            </p>

            <div className="text-sm text-muted-foreground mb-4">
              <p>
                <strong>Start:</strong> {new Date(event.startDate).toLocaleDateString()}
              </p>
              <p>
                <strong>End:</strong> {new Date(event.endDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Radius:</strong> {event.radius}m
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleToggleStatus(event.id)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
              >
                {event.status === "Active" ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => openEditModal(event)}
                className="px-4 py-2 rounded-lg bg-[#ee8724] text-white hover:bg-[#d97618] transition-colors flex items-center gap-2"
                style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty/No Results State */}
      {filteredEvents.length === 0 && (
        <div
          className="rounded-xl p-12 text-center border"
          style={{
            background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3
            className="mb-2"
            style={{
              fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.h3}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.brand.orange,
            }}
          >
            {searchQuery ? "No events found" : "No events yet"}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try a different search term"
              : "Create your first event to get started"}
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-2xl w-full my-8 border"
            style={{
              background: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="mb-6"
              style={{
                fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                fontSize: `${DESIGN_TOKENS.typography.fontSize.h2}px`,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.brand.red,
              }}
            >
              {editingEvent ? "Edit Event" : "Create Event"}
            </h3>

            <div className="space-y-4">
              {/* Event Name */}
              <div>
                <label
                  className="block mb-2 text-muted-foreground"
                  style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.medium }}
                >
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
                  style={{
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  className="block mb-2 text-muted-foreground"
                  style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.medium }}
                >
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none resize-none"
                  style={{
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
              </div>

              {/* Date & Time Range */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block mb-2 text-muted-foreground"
                    style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.medium }}
                  >
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
                    style={{
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block mb-2 text-muted-foreground"
                    style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.medium }}
                  >
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
                    style={{
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </div>
              </div>

              {/* Location Name */}
              <div>
                <label
                  className="block mb-2 text-muted-foreground"
                  style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.medium }}
                >
                  Location Name
                </label>
                <input
                  type="text"
                  value={formData.locationName || ''}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  placeholder="e.g., Tagum City Hall, Freedom Park"
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
                  style={{
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
              </div>

              {/* Geofence Coordinates & Radius */}
              <div>
                <label
                  className="block mb-2 text-muted-foreground flex items-center gap-2"
                  style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.medium }}
                >
                  <MapPin className="w-4 h-4 text-[#f6421f]" />
                  Geofence Coordinates & Radius
                </label>
                <div className="grid md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                      placeholder="Latitude"
                      className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
                      style={{
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Tagum: ~7.4500</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                      placeholder="Longitude"
                      className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
                      style={{
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Tagum: ~125.8078</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.radius}
                      onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) || 0 })}
                      placeholder="Radius (meters)"
                      className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
                      style={{
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Typical: 50-200m</p>
                  </div>
                </div>

                {/* Geofence Info Display */}
                {formData.lat && formData.lng && formData.radius > 0 && (
                  <div
                    className="p-3 rounded-xl flex items-start gap-3"
                    style={{
                      background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      border: isDark ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.15)',
                    }}
                  >
                    <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
                        Geofence Active
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Location: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Members must be within {formData.radius} meters to check in
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  Set the exact coordinates where the event will be held. Attendance can only be recorded within the specified radius.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrEdit}
                className="flex-1 px-4 py-3 rounded-xl text-white transition-colors"
                style={{
                  background: "linear-gradient(135deg, #f6421f 0%, #ee8724 100%)",
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                }}
              >
                {editingEvent ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
