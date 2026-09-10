import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import NavDrawer from "../components/layout/NavDrawer";
import MyEventsView from "../components/dashboard/MyEventsView";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import CreateEventModal from "../components/events/CreateEventModal";
import ConfirmAttendanceModal from "../components/events/ConfirmAttendanceModal";
import AttendeesModal from "../components/events/AttendeesModal";


import { DEMO_USERS, DEFAULT_EVENTS } from "../constants/mockData";
import type { AuthUser, EventItem } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();

  // Active user state
  const [user, setUser] = useState<AuthUser>(() => {
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
    if (rawUser) {
      try {
        return JSON.parse(rawUser);
      } catch {
        return DEMO_USERS[0];
      }
    }
    return DEMO_USERS[0];
  });

  // Events state
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_EVENTS;
    try {
      const saved = localStorage.getItem("dashboard_events");
      return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
    } catch {
      return DEFAULT_EVENTS;
    }
  });

  // Navigation view: "dashboard" or "my-events"
  const [currentView, setCurrentView] = useState<"dashboard" | "my-events">("dashboard");
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [confirmModalEvent, setConfirmModalEvent] = useState<EventItem | null>(null);
  const [attendeesModalEvent, setAttendeesModalEvent] = useState<EventItem | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login", { replace: true });
  };

  const handleSwitchUser = (newUser: AuthUser) => {
    setUser(newUser);
    localStorage.setItem("authUser", JSON.stringify(newUser));
    showToast(`Switched active user to ${newUser.name}`);
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

  const handleAttendanceConfirm = (decision: "yes" | "no") => {
    if (!confirmModalEvent) return;

    const eventSchedule = `${confirmModalEvent.date} ${confirmModalEvent.time}`;
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
        : `You responded NO for "${confirmModalEvent.title}".`
    );
  };

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

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesTag =
        selectedTagFilter === "All" ||
        e.tags?.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase());

      const matchesStatus =
        selectedStatusFilter === "All" || e.status === selectedStatusFilter;

      const matchesSearch =
        searchQuery.trim() === "" ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        e.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTag && matchesStatus && matchesSearch;
    });
  }, [events, selectedTagFilter, selectedStatusFilter, searchQuery]);

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
        eventsCount={events.length}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenMenu={() => setIsNavDrawerOpen(true)}
        onOpenCreateModal={openCreateModal}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        availableUsers={DEMO_USERS}
      />

      {/* Navigation Drawer (via "=" button) */}
      <NavDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        user={user}
        eventsCount={events.length}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenCreateModal={openCreateModal}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        availableUsers={DEMO_USERS}
      />

      {/* Main Views */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {currentView === "my-events" ? (
          <MyEventsView
            events={events}
            filteredEvents={filteredEvents}
            currentUser={user}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatus={selectedStatusFilter}
            onStatusChange={setSelectedStatusFilter}
            tags={allUniqueTags}
            selectedTag={selectedTagFilter}
            onSelectTag={setSelectedTagFilter}
            getTagCount={getTagCount}
            onBackToDashboard={() => setCurrentView("dashboard")}
            onOpenCreateModal={openCreateModal}
            onEditEvent={openEditModal}
            onDeleteEvent={handleDeleteEvent}
            onConfirmAttendance={(evt) => setConfirmModalEvent(evt)}
            onViewAttendees={(evt) => setAttendeesModalEvent(evt)}
            onClearFilters={() => {
              setSearchQuery("");
              setSelectedTagFilter("All");
              setSelectedStatusFilter("All");
            }}
          />
        ) : (
          <DashboardOverview
            user={user}
            events={events}
            filteredEvents={filteredEvents}
            uniqueTags={allUniqueTags}
            selectedTag={selectedTagFilter}
            onSelectTag={setSelectedTagFilter}
            getTagCount={getTagCount}
            onGoToMyEvents={() => setCurrentView("my-events")}
            onOpenCreateModal={openCreateModal}
            onEditEvent={openEditModal}
            onDeleteEvent={handleDeleteEvent}
            onConfirmAttendance={(evt) => setConfirmModalEvent(evt)}
            onViewAttendees={(evt) => setAttendeesModalEvent(evt)}
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

      {/* Attendees List Modal */}
      <AttendeesModal
        isOpen={Boolean(attendeesModalEvent)}
        onClose={() => setAttendeesModalEvent(null)}
        event={attendeesModalEvent}
      />
    </div>
  );
}
