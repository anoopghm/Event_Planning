import Button from "../ui/Button";
import StatsGrid from "./StatsGrid";
import TagFilter from "../events/TagFilter";
import EventCard from "../events/EventCard";
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
  onViewAttendees: (event: EventItem) => void;
}

export default function DashboardOverview({
  user,
  events,
  filteredEvents,
  uniqueTags,
  selectedTag,
  onSelectTag,
  getTagCount,
  onGoToMyEvents,
  onOpenCreateModal,
  onEditEvent,
  onDeleteEvent,
  onConfirmAttendance,
  onViewAttendees,
}: DashboardOverviewProps) {
  const createdByYouCount = events.filter(
    (e) => String(e.creatorId) === String(user.id)
  ).length;

  const attendingCount = events.filter((e) =>
    e.attendees?.some(
      (a) => String(a.userId) === String(user.id) && a.status === "yes"
    )
  ).length;

  return (
    <div>
      {/* Welcome Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-8 text-white shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-block rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
              Planning Dashboard
            </span>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Welcome, {user.name}!
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Manage your events, confirm invitations, track RSVPs, and organize schedules seamlessly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGoToMyEvents}
              className="rounded-[10px] border border-neutral-700 bg-neutral-800/80 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-700 transition cursor-pointer"
            >
              Go to My Events ({events.length}) →
            </button>
            <Button variant="primary" onClick={onOpenCreateModal}>
              + Create New Event
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid
        totalEvents={events.length}
        createdCount={createdByYouCount}
        attendingCount={attendingCount}
        tagsCount={uniqueTags.length}
        onCardClick={onGoToMyEvents}
      />

      {/* Overview Section */}
      <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Active Events & RSVPs
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Click "Confirm" on any event you didn't organize to submit your attendance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoToMyEvents}
              className="text-xs font-semibold text-red-500 hover:text-red-600 hover:underline cursor-pointer"
            >
              Go to My Events (Edit / Delete / RSVP) →
            </button>
            <Button variant="secondary" onClick={onOpenCreateModal}>
              + Add Event
            </Button>
          </div>
        </div>

        {/* Tag Quick Filter */}
        <div className="border-b border-neutral-100 pb-4">
          <TagFilter
            tags={uniqueTags}
            selectedTag={selectedTag}
            onSelectTag={onSelectTag}
            totalCount={events.length}
            getCountForTag={getTagCount}
          />
        </div>

        {/* Events preview list */}
        <div className="mt-4 divide-y divide-neutral-100">
          {filteredEvents.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-500">No events found matching your filter.</p>
            </div>
          ) : (
            filteredEvents.slice(0, 5).map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                currentUser={user}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                onConfirmAttendance={onConfirmAttendance}
                onViewAttendees={onViewAttendees}
                variant="row"
              />
            ))
          )}
        </div>

        {events.length > 5 && (
          <div className="mt-4 pt-3 border-t border-neutral-100 text-center">
            <button
              type="button"
              onClick={onGoToMyEvents}
              className="text-xs font-semibold text-red-500 hover:text-red-600 cursor-pointer"
            >
              View all {events.length} events in My Events →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
