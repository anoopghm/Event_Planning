import { useState, useMemo, useEffect, useCallback } from "react";
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
import {
  fetchEventsApi,
  createEventApi,
  updateEventApi,
  deleteEventApi,
  markPresenceApi
} from "../utils/eventApi";

import type { AuthUser, EventItem, PaginationMeta, StatusCounts, EventSortOption } from "../types";

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

  // Events & Server Pagination State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 4,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    upcoming: 0,
    ongoing: 0,
    past: 0
  });
  const [allUniqueTags, setAllUniqueTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"All" | "Ongoing" | "Upcoming" | "Past">("Upcoming");
  const [sortBy, setSortBy] = useState<EventSortOption>("event_time_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

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

  // Fetch events using Server-Side Pagination & Filtering
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchEventsApi({
        page: currentPage,
        limit: 4,
        status: activeTab,
        tag: selectedTagFilter,
        search: searchQuery.trim().length >= 3 ? searchQuery.trim() : undefined,
        creator: currentView === "my-events" ? "me" : undefined,
        sort: sortBy
      });
      setEvents(res.events);
      setPagination(res.pagination);
      setStatusCounts(res.counts);
      if (res.tags && res.tags.length > 0) {
        setAllUniqueTags(res.tags);
      }
    } catch (err) {
      console.error("Failed to fetch events from API:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeTab, selectedTagFilter, searchQuery, currentView, sortBy]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleTabChange = (tab: "All" | "Ongoing" | "Upcoming" | "Past") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleTagFilterChange = (tag: string) => {
    setSelectedTagFilter(tag);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: EventSortOption) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCreateEvent = async (newEventData: Omit<EventItem, "id">) => {
    try {
      const created = await createEventApi({
        ...newEventData,
        creatorId: user.id,
        creatorName: user.name,
        creatorEmail: user.email
      });
      showToast(`"${created.title}" event created successfully!`);
      loadEvents();
    } catch (e: any) {
      showToast(e.message || "Failed to create event");
    }
  };

  const handleUpdateEvent = async (updatedEvent: EventItem) => {
    try {
      const updated = await updateEventApi(updatedEvent.id, updatedEvent);
      showToast(`"${updated.title}" updated successfully!`);
      loadEvents();
    } catch (e: any) {
      showToast(e.message || "Failed to update event");
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteEventApi(id);
        showToast(`"${title}" was removed.`);
        loadEvents();
      } catch (e: any) {
        showToast(e.message || "Failed to delete event");
      }
    }
  };

  const handleAttendanceConfirm = async (decision: "yes" | "no" | "maybe") => {
    if (!confirmModalEvent) return;

    try {
      await markPresenceApi(confirmModalEvent.id, decision, user);
      showToast(
        decision === "yes"
          ? `You confirmed YES for "${confirmModalEvent.title}".`
          : decision === "maybe"
          ? `You responded MAYBE for "${confirmModalEvent.title}".`
          : `You responded NO for "${confirmModalEvent.title}".`
      );
      setConfirmModalEvent(null);
      await loadEvents();
    } catch (e: any) {
      showToast(e.message || "Failed to update attendance");
    }
  };

  // User-created events (strictly creatorId === user.id)
  const userCreatedEvents = useMemo(() => {
    return events.filter((e) => String(e.creatorId) === String(user.id));
  }, [events, user.id]);

  // Tags for all events (Dashboard view)
  const dashboardUniqueTags = useMemo(() => {
    if (allUniqueTags.length > 0) return allUniqueTags;
    const set = new Set<string>();
    events.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [allUniqueTags, events]);

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
    const isSearchActive = searchQuery.trim().length >= 3;
    const matched = events.filter((e) => {
      // 1. Tag filter
      const matchesTag =
        selectedTagFilter === "All" ||
        e.tags?.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase());

      // 2. Status filter (Active search includes all Upcoming, Ongoing, and Past events)
      const st = getEffectiveEventStatus(e);
      const matchesStatus =
        isSearchActive ||
        selectedStatusFilter === "All" ||
        (selectedStatusFilter === "Past" || selectedStatusFilter === "Finished"
          ? st === "Past" || (st as string) === "Finished"
          : st === selectedStatusFilter);

      // 3. Event Type filter (Public or Private)
      const matchesEventType =
        selectedEventTypeFilter === "All" ||
        (e.eventType || "Public") === selectedEventTypeFilter;

      // 4. Levenshtein Search (title, location, description, tags - requires >= 3 letters)
      const matchesSearch = matchEventByLevenshtein(e, searchQuery);

      return matchesTag && matchesStatus && matchesEventType && matchesSearch;
    });

    if (isSearchActive) {
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
    const isSearchActive = searchQuery.trim().length >= 3;
    const matched = userCreatedEvents.filter((e) => {
      // 1. Tag filter
      const matchesTag =
        selectedTagFilter === "All" ||
        e.tags?.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase());

      // 2. Status filter (Active search includes all Upcoming, Ongoing, and Past events)
      const st = getEffectiveEventStatus(e);
      const matchesStatus =
        isSearchActive ||
        selectedStatusFilter === "All" ||
        (selectedStatusFilter === "Past" || selectedStatusFilter === "Finished"
          ? st === "Past" || (st as string) === "Finished"
          : st === selectedStatusFilter);

      // 3. Event Type filter (Public or Private)
      const matchesEventType =
        selectedEventTypeFilter === "All" ||
        (e.eventType || "Public") === selectedEventTypeFilter;

      // 4. Levenshtein Search (title, location, description, tags - requires >= 3 letters)
      const matchesSearch = matchEventByLevenshtein(e, searchQuery);

      return matchesTag && matchesStatus && matchesEventType && matchesSearch;
    });

    if (isSearchActive) {
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
      <main className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-8">
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
            uniqueTags={dashboardUniqueTags}
            selectedTag={selectedTagFilter}
            onSelectTag={handleTagFilterChange}
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
            onSearchChange={handleSearchChange}
            pagination={pagination}
            onPageChange={setCurrentPage}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            counts={statusCounts}
            isLoading={isLoading}
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
            (a) =>
              String(a.userId) === String(user.id) ||
              a.userId === "currentUser" ||
              (user.email && a.userEmail === user.email)
          ) || null
        }
        onConfirm={handleAttendanceConfirm}
        timeHasChanged={Boolean(
          confirmModalEvent &&
            confirmModalEvent.attendees?.some(
              (a) =>
                (String(a.userId) === String(user.id) ||
                  a.userId === "currentUser" ||
                  (user.email && a.userEmail === user.email)) &&
                a.acknowledgedTime &&
                a.acknowledgedTime !==
                  (confirmModalEvent.endTime
                    ? `${confirmModalEvent.date} ${confirmModalEvent.time}-${confirmModalEvent.endTime}`
                    : `${confirmModalEvent.date} ${confirmModalEvent.time}`)
            )
        )}
      />
    </div>
  );
}
