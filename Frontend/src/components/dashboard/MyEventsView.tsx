import EventCard from "../events/EventCard";
import TagFilter from "../events/TagFilter";
import type { EventItem, AuthUser } from "../../types";

interface MyEventsViewProps {
  events: EventItem[];
  filteredEvents: EventItem[];
  currentUser: AuthUser;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
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
  const hasActiveFilters =
    Boolean(searchQuery) || selectedTag !== "All" || selectedStatus !== "All";

  return (
    <div>
      {/* Header Banner */}
      <div className="mb-8 rounded-2xl bg-white border border-neutral-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                Created By You
              </span>
              <span className="text-xs text-neutral-400">
                • Total: {events.length}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl text-neutral-900">
              My Events
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage all events you have created. You can update schedules, edit details, track attendee RSVPs, or remove events.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 transition cursor-pointer shadow-2xs"
            >
              ← Back to Dashboard
            </button>
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition cursor-pointer"
            >
              <span>+</span>
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-neutral-100">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search your events by title, venue, or tag..."
                className="w-full h-11 rounded-xl border border-neutral-300 bg-neutral-50/70 px-4 pl-10 text-sm outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 shadow-2xs"
              />
              <span className="absolute left-3.5 top-3 text-sm text-neutral-400">
                🔍
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3.5 top-3 text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="sm:w-56">
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full h-11 rounded-xl border border-neutral-300 bg-neutral-50/70 px-4 text-sm outline-none transition focus:border-red-500 focus:bg-white cursor-pointer shadow-2xs"
              >
                <option value="All">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Finished">Finished</option>
              </select>
            </div>
          </div>

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
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-500">
            📅
          </div>
          <h3 className="mt-4 text-lg font-bold text-neutral-900">
            {events.length === 0
              ? "You haven't created any events yet"
              : "No matching events found"}
          </h3>
          <p className="mt-1 text-sm text-neutral-500 max-w-md mx-auto">
            {events.length === 0
              ? "Get started by creating your first event to organize schedules, track attendee RSVPs, and collaborate."
              : "Try adjusting your search query or filters to find your created events."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {hasActiveFilters && events.length > 0 && (
              <button
                type="button"
                onClick={onClearFilters}
                className="rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer shadow-2xs"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 text-sm font-semibold shadow-xs hover:shadow-sm cursor-pointer"
            >
              + Create Event
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredEvents.map((evt) => (
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
