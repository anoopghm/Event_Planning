import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import NavDrawer from "../components/layout/NavDrawer";
import MyEventsView from "../components/dashboard/MyEventsView";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import CreateEventModal from "../components/events/CreateEventModal";
import ConfirmAttendanceModal from "../components/events/ConfirmAttendanceModal";
import EventDetailsModal from "../components/events/EventDetailsModal";
import { getEffectiveEventStatus } from "../utils/eventUtils";
import { matchEventByLevenshtein, getEventLevenshteinScore } from "../utils/searchUtils";
import { logoutUser } from "../utils/apiClient";


import type { AuthUser, EventItem } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();

  // Active user state (from localStorage or safe fallback)
  const [user] = useState<AuthUser>(() => {
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
    if (rawUser) {
      try {
        return JSON.parse(rawUser);
      } catch {
        // fallback
      }
    }
    return { id: 1, name: "Organizer", email: "organizer@evently.com" };
  });

  // Events state (purely user-created / saved events, removing any legacy mock IDs)
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("dashboard_events");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Purge legacy mock data items (evt-1 through evt-7)
          const nonMock = parsed.filter(
            (e: EventItem) => !e.id?.match(/^evt-[1-7]$/)
          );
          return nonMock;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Navigation view: "dashboard" or "my-events"
  const [currentView, setCurrentView] = useState<"dashboard" | "my-events">("dashboard");
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [confirmModalEvent, setConfirmModalEvent] = useState<EventItem | null>(null);
  const [detailsModalEvent, setDetailsModalEvent] = useState<EventItem | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [selectedEventTypeFilter, setSelectedEventTypeFilter] = useState<string>("All");

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };


  const openCreateModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCreateEvent = (newEventData: Omit<EventItem, "id">) => {
    const newEvent: EventItem = {
      ...newEventData,
      id: `evt-${Date.now()}`,
      creatorId: user.id,
      creatorName: user.name,
      creatorEmail: user.email,
      attendees: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newEvent, ...events];
    setEvents(updated);
    try {
      localStorage.setItem("dashboard_events", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
    showToast(`"${newEvent.title}" event created successfully!`);
  };

  const handleUpdateEvent = (updatedEvent: EventItem) => {
    const updated = events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
    setEvents(updated);
    try {
      localStorage.setItem("dashboard_events", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to update localStorage", e);
    }
    showToast(`"${updatedEvent.title}" updated successfully!`);
  };

  const handleDeleteEvent = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      const updated = events.filter((evt) => evt.id !== id);
      setEvents(updated);
      try {
        localStorage.setItem("dashboard_events", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update localStorage", e);
      }
      showToast(`"${title}" was removed.`);
    }
  };

  const handleAttendanceConfirm = (decision: "yes" | "no" | "maybe") => {
    if (!confirmModalEvent) return;

    const eventSchedule = confirmModalEvent.endTime
      ? `${confirmModalEvent.date} ${confirmModalEvent.time} - ${confirmModalEvent.endTime}`
      : `${confirmModalEvent.date} ${confirmModalEvent.time}`;
    const existingAttendees = confirmModalEvent.attendees || [];
    const filteredAttendees = existingAttendees.filter(
      (a) => String(a.userId) !== String(user.id)
    );

    const newAttendeeRecord = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      status: decision,
      acknowledgedTime: eventSchedule,
      updatedAt: new Date().toISOString(),
    };

    const updatedAttendees = [...filteredAttendees, newAttendeeRecord];

    const updatedEvents = events.map((evt) =>
      evt.id === confirmModalEvent.id
        ? { ...evt, attendees: updatedAttendees }
        : evt
    );

    setEvents(updatedEvents);
    try {
      localStorage.setItem("dashboard_events", JSON.stringify(updatedEvents));
    } catch (e) {
      console.error("Failed to update localStorage", e);
    }

    setConfirmModalEvent(null);
    showToast(
      decision === "yes"
        ? `You confirmed YES for "${confirmModalEvent.title}".`
        : decision === "maybe"
        ? `You responded MAYBE for "${confirmModalEvent.title}".`
        : `You responded NO for "${confirmModalEvent.title}".`
    );
  };

  // User-created events (strictly creatorId === user.id)
  const userCreatedEvents = useMemo(() => {
    return events.filter((e) => String(e.creatorId) === String(user.id));
  }, [events, user.id]);

  // Tags for all events (Dashboard view)
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [events]);

  const getTagCount = (tag: string) => {
    return events.filter((e) =>
      e.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
    ).length;
  };

  // Tags strictly for user-created events (My Events view)
  const myEventsUniqueTags = useMemo(() => {
    const set = new Set<string>();
    userCreatedEvents.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [userCreatedEvents]);

  const getMyEventsTagCount = (tag: string) => {
    return userCreatedEvents.filter((e) =>
      e.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
    ).length;
  };

  // Filtered events for Dashboard
  const filteredDashboardEvents = useMemo(() => {
    const matched = events.filter((e) => {
      // 1. Tag filter
      const matchesTag =
        selectedTagFilter === "All" ||
        e.tags?.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase());

      // 2. Status filter (Search includes all Upcoming, Ongoing, and Past events)
      const st = getEffectiveEventStatus(e);
      const matchesStatus =
        searchQuery.trim() !== "" ||
        selectedStatusFilter === "All" ||
        (selectedStatusFilter === "Past" || selectedStatusFilter === "Finished"
          ? st === "Past" || (st as string) === "Finished"
          : st === selectedStatusFilter);

      // 3. Event Type filter (Public or Private)
      const matchesEventType =
        selectedEventTypeFilter === "All" ||
        (e.eventType || "Public") === selectedEventTypeFilter;

      // 4. Levenshtein Search (title, location, description, tags)
      const matchesSearch = matchEventByLevenshtein(e, searchQuery);

      return matchesTag && matchesStatus && matchesEventType && matchesSearch;
    });

    if (searchQuery.trim()) {
      return matched.sort(
        (a, b) =>
          getEventLevenshteinScore(b, searchQuery) -
          getEventLevenshteinScore(a, searchQuery)
      );
    }

    return matched;
  }, [events, selectedTagFilter, selectedStatusFilter, selectedEventTypeFilter, searchQuery]);

  // Filtered events strictly for My Events
  const filteredMyEvents = useMemo(() => {
    const matched = userCreatedEvents.filter((e) => {
      // 1. Tag filter
      const matchesTag =
        selectedTagFilter === "All" ||
        e.tags?.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase());

      // 2. Status filter (Search includes all Upcoming, Ongoing, and Past events)
      const st = getEffectiveEventStatus(e);
      const matchesStatus =
        searchQuery.trim() !== "" ||
        selectedStatusFilter === "All" ||
        (selectedStatusFilter === "Past" || selectedStatusFilter === "Finished"
          ? st === "Past" || (st as string) === "Finished"
          : st === selectedStatusFilter);

      // 3. Event Type filter (Public or Private)
      const matchesEventType =
        selectedEventTypeFilter === "All" ||
        (e.eventType || "Public") === selectedEventTypeFilter;

      // 4. Levenshtein Search (title, location, description, tags)
      const matchesSearch = matchEventByLevenshtein(e, searchQuery);

      return matchesTag && matchesStatus && matchesEventType && matchesSearch;
    });

    if (searchQuery.trim()) {
      return matched.sort(
        (a, b) =>
          getEventLevenshteinScore(b, searchQuery) -
          getEventLevenshteinScore(a, searchQuery)
      );
    }

    return matched;
  }, [userCreatedEvents, selectedTagFilter, selectedStatusFilter, selectedEventTypeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-xl transition-all animate-in fade-in slide-in-from-top-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
            ✓
          </span>
          <p className="text-sm font-medium text-neutral-800">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-neutral-400 hover:text-neutral-600 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        user={user}
        eventsCount={userCreatedEvents.length}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenMenu={() => setIsNavDrawerOpen(true)}
        onOpenCreateModal={openCreateModal}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Navigation Drawer (via "=" button) */}
      <NavDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        user={user}
        eventsCount={userCreatedEvents.length}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenCreateModal={openCreateModal}
        onLogout={handleLogout}
      />

      {/* Main Views */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {currentView === "my-events" ? (
          <MyEventsView
            events={userCreatedEvents}
            filteredEvents={filteredMyEvents}
            currentUser={user}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatus={selectedStatusFilter}
            onStatusChange={setSelectedStatusFilter}
            selectedEventType={selectedEventTypeFilter}
            onEventTypeChange={setSelectedEventTypeFilter}
            tags={myEventsUniqueTags}
            selectedTag={selectedTagFilter}
            onSelectTag={setSelectedTagFilter}
            getTagCount={getMyEventsTagCount}
            onBackToDashboard={() => setCurrentView("dashboard")}
            onOpenCreateModal={openCreateModal}
            onEditEvent={openEditModal}
            onDeleteEvent={handleDeleteEvent}
            onConfirmAttendance={(evt) => setConfirmModalEvent(evt)}
            onViewDetails={(evt) => setDetailsModalEvent(evt)}
            onClearFilters={() => {
              setSearchQuery("");
              setSelectedTagFilter("All");
              setSelectedStatusFilter("All");
              setSelectedEventTypeFilter("All");
            }}
          />
        ) : (
          <DashboardOverview
            user={user}
            events={events}
            filteredEvents={filteredDashboardEvents}
            uniqueTags={allUniqueTags}
            selectedTag={selectedTagFilter}
            onSelectTag={setSelectedTagFilter}
            selectedEventType={selectedEventTypeFilter}
            onSelectEventType={setSelectedEventTypeFilter}
            getTagCount={getTagCount}
            onGoToMyEvents={() => setCurrentView("my-events")}
            onOpenCreateModal={openCreateModal}
            onEditEvent={openEditModal}
            onDeleteEvent={handleDeleteEvent}
            onConfirmAttendance={(evt) => setConfirmModalEvent(evt)}
            onViewDetails={(evt) => setDetailsModalEvent(evt)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </main>

      {/* Unified Create / Edit Modal */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleCreateEvent}
        eventToEdit={editingEvent}
        onUpdate={handleUpdateEvent}
      />

      {/* Event Details Modal (includes full details & RSVP list) */}
      <EventDetailsModal
        isOpen={Boolean(detailsModalEvent)}
        onClose={() => setDetailsModalEvent(null)}
        event={detailsModalEvent}
        currentUser={user}
        onConfirmAttendance={(evt) => {
          setDetailsModalEvent(null);
          setConfirmModalEvent(evt);
        }}
        onEdit={(evt) => {
          setDetailsModalEvent(null);
          openEditModal(evt);
        }}
      />

      {/* Attendance Confirmation Modal */}
      <ConfirmAttendanceModal
        isOpen={Boolean(confirmModalEvent)}
        onClose={() => setConfirmModalEvent(null)}
        event={confirmModalEvent}
        currentAttendee={
          confirmModalEvent?.attendees?.find(
            (a) => String(a.userId) === String(user.id)
          ) || null
        }
        onConfirm={handleAttendanceConfirm}
        timeHasChanged={Boolean(
          confirmModalEvent &&
            confirmModalEvent.attendees?.some(
              (a) =>
                String(a.userId) === String(user.id) &&
                a.acknowledgedTime &&
                a.acknowledgedTime !== `${confirmModalEvent.date} ${confirmModalEvent.time}`
            )
        )}
      />
    </div>
  );
}
