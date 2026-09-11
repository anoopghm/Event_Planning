import { useState, useMemo } from "react";
import StatsGrid from "./StatsGrid";
import EventCard from "../events/EventCard";
import { getEffectiveEventStatus } from "../../utils/eventUtils";
import type { EventItem, AuthUser } from "../../types";

interface DashboardOverviewProps {
  user: AuthUser;
  events: EventItem[];
  filteredEvents: EventItem[];
  uniqueTags: string[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  getTagCount: (tag: string) => number;
  onGoToMyEvents: () => void;
  onOpenCreateModal: () => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (id: string, title: string) => void;
  onConfirmAttendance: (event: EventItem) => void;
  onViewDetails: (event: EventItem) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function DashboardOverview({
  user,
  events,
  uniqueTags,
  selectedTag,
  onSelectTag,
  getTagCount,
  onGoToMyEvents,
  onOpenCreateModal,
  onEditEvent,
  onDeleteEvent,
  onConfirmAttendance,
  onViewDetails,
  searchQuery,
  onSearchChange,
}: DashboardOverviewProps) {
  // Tabs: "Ongoing", "Upcoming", "Finished" (Upcoming is active by default as shown in design)
  const [activeTab, setActiveTab] = useState<"Ongoing" | "Upcoming" | "Finished">("Upcoming");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const activeSearch = searchQuery !== undefined ? searchQuery : localSearchQuery;
  const handleSearchChange = onSearchChange || setLocalSearchQuery;

  // Stats calculation
  const createdByYouCount = events.filter(
    (e) => String(e.creatorId) === String(user.id)
  ).length;

  const attendingCount = events.filter((e) =>
    e.attendees?.some(
      (a) => String(a.userId) === String(user.id) && a.status === "yes"
    )
  ).length;

  // Filter events based on active tab ("Ongoing", "Upcoming", "Finished"), selectedTag, and searchQuery
  const tabFilteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesTab = getEffectiveEventStatus(e) === activeTab;
      const matchesTag =
        selectedTag === "All" ||
        e.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
      const matchesSearch =
        activeSearch.trim() === "" ||
        e.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
        e.description.toLowerCase().includes(activeSearch.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(activeSearch.toLowerCase())) ||
        e.tags?.some((t) => t.toLowerCase().includes(activeSearch.toLowerCase()));

      return matchesTab && matchesTag && matchesSearch;
    });
  }, [events, activeTab, selectedTag, activeSearch]);

  const totalItems = tabFilteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Current page slice
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tabFilteredEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [tabFilteredEvents, currentPage, itemsPerPage]);

  const startItemNumber = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItemNumber = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="space-y-8">
      {/* 1. Dark Welcome Banner (Matches screenshot) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#18181b] px-7 py-8 text-white shadow-md">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-normal text-neutral-400">
              Welcome back,
            </span>
            <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {user.name}!
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
              Manage your events, confirm invitations, track RSVPs, and organize schedules seamlessly.
            </p>
          </div>

          {/* Right graphic box */}
          <div className="flex items-center gap-3.5 md:border-l md:border-neutral-700/80 md:pl-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-600 bg-neutral-800/80 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-200">
                Turn ideas into
              </p>
              <p className="text-xs font-semibold text-white">
                unforgettable events.
              </p>
              <div className="mt-1 h-0.5 w-10 bg-neutral-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid (4 cards matching screenshot) */}
      <StatsGrid
        totalEvents={events.length}
        createdCount={createdByYouCount}
        attendingCount={attendingCount}
        tagsCount={uniqueTags.length}
        onCardClick={onGoToMyEvents}
      />

      {/* 3. Events Section */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              Events
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Browse your events, view details, and manage RSVPs.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-neutral-800 transition cursor-pointer shadow-xs"
          >
            <span className="text-base font-normal">+</span>
            <span>Create Event</span>
          </button>
        </div>

        {/* Tabs & Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
          {/* Status Tabs: Ongoing / Upcoming / Finished */}
          <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-1 border border-neutral-200/80 w-fit">
            {(["Ongoing", "Upcoming", "Finished"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-4.5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-[#18181b] text-white shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a34] hover:bg-[#162e29] px-4.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filter</span>
              {(selectedTag !== "All" || activeSearch) && (
                <span className="h-2 w-2 rounded-full bg-red-400" />
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 z-30 w-72 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span className="text-xs font-bold text-neutral-800">Filter Events</span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTag("All");
                      handleSearchChange("");
                      setIsFilterOpen(false);
                    }}
                    className="text-[11px] text-red-500 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                {/* Search query input */}
                <div className="mt-3">
                  <label className="text-[11px] font-semibold text-neutral-600">Search</label>
                  <input
                    type="text"
                    value={activeSearch}
                    onChange={(e) => {
                      handleSearchChange(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by title, location..."
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs outline-none focus:border-neutral-900"
                  />
                </div>

                {/* Tag Filter */}
                <div className="mt-3">
                  <label className="text-[11px] font-semibold text-neutral-600">Tag / Category</label>
                  <div className="mt-1 flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTag("All");
                        setCurrentPage(1);
                      }}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                        selectedTag === "All"
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      All ({events.length})
                    </button>
                    {uniqueTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          onSelectTag(tag);
                          setCurrentPage(1);
                        }}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                          selectedTag.toLowerCase() === tag.toLowerCase()
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }`}
                      >
                        #{tag} ({getTagCount(tag)})
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="mt-4 w-full rounded-lg bg-neutral-900 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Event Cards List (Matches horizontal card list in screenshot) */}
        <div className="space-y-3 pt-2">
          {paginatedEvents.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-xl">
                📅
              </div>
              <h3 className="mt-3 text-sm font-semibold text-neutral-900">
                No {activeTab.toLowerCase()} events found
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                There are currently no events under "{activeTab}" matching your filters.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {(selectedTag !== "All" || activeSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTag("All");
                      handleSearchChange("");
                    }}
                    className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  className="rounded-xl bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 cursor-pointer"
                >
                  + Create Event
                </button>
              </div>
            </div>
          ) : (
            paginatedEvents.map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                currentUser={user}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                onConfirmAttendance={onConfirmAttendance}
                onViewDetails={onViewDetails}
                variant="row"
              />
            ))
          )}
        </div>

        {/* 4. Pagination & Stats Footer (Matches screenshot: < [1] [2] [3] > Showing 1-3 of 7 events) */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-neutral-200/80">
            <div className="flex items-center gap-1.5">
              {/* Previous page button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                aria-label="Previous Page"
              >
                ‹
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-[#18181b] text-white shadow-xs"
                        : "border border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next page button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                aria-label="Next Page"
              >
                ›
              </button>
            </div>

            {/* Showing count indicator */}
            <p className="text-xs text-neutral-500 font-medium">
              Showing {startItemNumber}-{endItemNumber} of {totalItems} events
            </p>
          </div>
        )}
      </div>

      {/* 5. Footer (Matches screenshot) */}
      <footer className="mt-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
        <p>© 2026 Evently. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <a href="#privacy" className="hover:text-neutral-800 transition">
            Privacy
          </a>
          <a href="#terms" className="hover:text-neutral-800 transition">
            Terms
          </a>
          <a href="#help" className="hover:text-neutral-800 transition">
            Help
          </a>
        </div>
      </footer>
    </div>
  );
}
