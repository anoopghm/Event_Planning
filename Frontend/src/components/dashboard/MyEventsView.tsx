import { useState, useMemo } from "react";
import {
  Search,
  X,
  Plus,
  ArrowLeft,
  CalendarX2,
} from "lucide-react";
import EventCard from "../events/EventCard";
import TagFilter from "../events/TagFilter";
import { sortEvents } from "../../utils/sortUtils";
import type { EventItem, AuthUser, EventSortOption } from "../../types";

interface MyEventsViewProps {
  events: EventItem[];
  filteredEvents: EventItem[];
  currentUser: AuthUser;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedEventType?: string;
  onEventTypeChange?: (type: string) => void;
  tags: string[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  getTagCount: (tag: string) => number;
  onBackToDashboard: () => void;
  onOpenCreateModal: () => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (id: string, title: string) => void;
  onConfirmAttendance: (event: EventItem) => void;
  onViewDetails: (event: EventItem) => void;
  onClearFilters: () => void;
}

export default function MyEventsView({
  events,
  filteredEvents,
  currentUser,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedEventType = "All",
  onEventTypeChange,
  tags,
  selectedTag,
  onSelectTag,
  getTagCount,
  onBackToDashboard,
  onOpenCreateModal,
  onEditEvent,
  onDeleteEvent,
  onConfirmAttendance,
  onViewDetails,
  onClearFilters,
}: MyEventsViewProps) {
  const [sortBy, setSortBy] = useState<EventSortOption>("event_time_asc");

  const isSearchActive = searchQuery.trim().length >= 3;

  const sortedEvents = useMemo(() => {
    return sortEvents(filteredEvents, sortBy, searchQuery);
  }, [filteredEvents, sortBy, searchQuery]);

  const hasActiveFilters =
    isSearchActive ||
    selectedTag !== "All" ||
    selectedStatus !== "All" ||
    selectedEventType !== "All" ||
    sortBy !== "event_time_asc";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                Created By You
              </span>
              <span className="text-xs font-medium text-slate-400">
                • {events.length} total organized
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              My Events
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl">
              Manage all events you have created. You can update schedules, edit details, track attendee RSVPs, or remove events.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <span>Back to Dashboard</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition cursor-pointer"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search your events (min. 3 characters)..."
                className="w-full h-10.5 rounded-xl border border-slate-200 bg-slate-100/70 px-4 pl-10 pr-24 text-xs sm:text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10 shadow-2xs"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              {searchQuery && (
                <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
                  {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                    <span className="pointer-events-none text-[10px] font-semibold text-amber-700 bg-amber-100/80 rounded-md px-1.5 py-0.5 hidden sm:inline">
                      {3 - searchQuery.trim().length} more
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg hover:bg-slate-200/60 transition"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="sm:w-44">
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full h-10.5 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-800 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 cursor-pointer shadow-2xs"
              >
                <option value="All">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Past">Past</option>
              </select>
            </div>

            {/* Event Type Dropdown */}
            <div className="sm:w-48">
              <select
                value={selectedEventType}
                onChange={(e) => onEventTypeChange && onEventTypeChange(e.target.value)}
                className="w-full h-10.5 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-800 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 cursor-pointer shadow-2xs"
              >
                <option value="All">All Types (Public & Private)</option>
                <option value="Public">Public Events</option>
                <option value="Private">Private Events</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="sm:w-52">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as EventSortOption)}
                className="w-full h-10.5 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-800 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 cursor-pointer shadow-2xs"
              >
                <option value="event_time_asc">Event Time (Soonest)</option>
                <option value="popularity">Popularity (Most RSVPs)</option>
                <option value="creation_time">Creation Time (Newest)</option>
                <option value="event_time_desc">Event Time (Furthest)</option>
              </select>
            </div>
          </div>

          {/* Type at least 3 chars notice */}
          {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 flex items-center justify-between gap-2 text-xs text-amber-800 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>Type at least 3 letters to search your events ({searchQuery.trim().length} of 3 entered).</span>
              </div>
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="font-medium text-amber-700 hover:text-amber-900 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Active Search Results Indicator */}
          {isSearchActive && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Search className="h-4 w-4 text-rose-600" />
                <span>
                  Search results for <strong className="text-rose-600 font-bold">"{searchQuery}"</strong> ({filteredEvents.length} found).
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium cursor-pointer self-start sm:self-auto text-xs"
              >
                <X className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            </div>
          )}

          {/* Tags Filter */}
          <TagFilter
            tags={tags}
            selectedTag={selectedTag}
            onSelectTag={onSelectTag}
            totalCount={events.length}
            getCountForTag={getTagCount}
          />
        </div>
      </div>

      {/* Events Grid / Cards */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <CalendarX2 className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            {events.length === 0
              ? "You haven't created any events yet"
              : "No matching events found"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {events.length === 0
              ? "Get started by creating your first event to organize schedules, track attendee RSVPs, and collaborate."
              : "Try adjusting your search query or filters to find your created events."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {hasActiveFilters && events.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClearFilters();
                  setSortBy("event_time_asc");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs hover:shadow cursor-pointer transition"
            >
              + Create Event
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {sortedEvents.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              currentUser={currentUser}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
              onConfirmAttendance={onConfirmAttendance}
              onViewDetails={onViewDetails}
              variant="card"
            />
          ))}
        </div>
      )}
    </div>
  );
}
