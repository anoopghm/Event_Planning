import Button from "../ui/Button";
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
  onViewAttendees: (event: EventItem) => void;
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
  onViewAttendees,
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
                Event Management
              </span>
              <span className="text-xs text-neutral-400">
                • Total: {events.length}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl text-neutral-900">
              My Events
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Events you created can be edited or deleted. Events by other organizers allow you to confirm or change your attendance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="secondary" onClick={onBackToDashboard}>
              ← Back to Dashboard
            </Button>
            <Button variant="primary" onClick={onOpenCreateModal}>
              + Create Event
            </Button>
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
                placeholder="Search events by title, venue, or tag..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-2.5 pl-9 text-sm outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-500/10"
              />
              <span className="absolute left-3 top-3 text-sm text-neutral-400">
                🔍
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
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
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:bg-white cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Planning in Progress">Planning in Progress</option>
                <option value="Upcoming">Upcoming</option>
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-2xl">
            📅
          </div>
          <h3 className="mt-4 text-base font-semibold text-neutral-900">
            No matching events found
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Try adjusting your search terms or filters, or create a brand new event.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {hasActiveFilters && (
              <Button variant="secondary" onClick={onClearFilters}>
                Clear Filters
              </Button>
            )}
            <Button variant="primary" onClick={onOpenCreateModal}>
              + Create Event
            </Button>
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
              onViewAttendees={onViewAttendees}
              variant="card"
            />
          ))}
        </div>
      )}
    </div>
  );
}
