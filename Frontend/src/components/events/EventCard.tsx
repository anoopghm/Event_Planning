import {
  formatDateTime,
  getTagStyle,
  getEffectiveEventStatus,
  getStatusBadge,
} from "../../utils/eventUtils";
import type { EventItem, AuthUser } from "../../types";

interface EventCardProps {
  event: EventItem;
  currentUser: AuthUser;
  onEdit: (event: EventItem) => void;
  onDelete: (id: string, title: string) => void;
  onConfirmAttendance: (event: EventItem) => void;
  onViewDetails: (event: EventItem) => void;
  onViewAttendees?: (event: EventItem) => void;
  variant?: "card" | "row";
}

export default function EventCard({
  event,
  currentUser,
  onEdit,
  onDelete,
  onConfirmAttendance,
  onViewDetails,
  variant = "row",
}: EventCardProps) {
  const isCreator = String(event.creatorId) === String(currentUser.id);
  const userAttendee = event.attendees?.find(
    (a) => String(a.userId) === String(currentUser.id)
  );

  // Status dynamically computed from meeting timings
  const status = getEffectiveEventStatus(event);

  const eventSchedule = event.endTime
    ? `${event.date} ${event.time}-${event.endTime}`
    : `${event.date} ${event.time}`;

  const timeHasChanged = Boolean(
    userAttendee &&
      userAttendee.acknowledgedTime &&
      userAttendee.acknowledgedTime !== eventSchedule
  );

  const fallbackImage =
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80";

  // Design row layout (matches dashboard list)
  if (variant === "row") {
    return (
      <div className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs transition hover:border-neutral-300 hover:shadow-md lg:flex-row lg:items-center lg:justify-between">
        {/* Left Section: Thumbnail + Info */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1 min-w-0">
          {/* Thumbnail */}
          <div
            onClick={() => onViewDetails(event)}
            className="relative h-32 sm:h-28 w-full shrink-0 cursor-pointer overflow-hidden rounded-xl border border-neutral-100 sm:w-48 md:w-52"
          >
            <img
              src={event.imageUrl || fallbackImage}
              alt={event.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImage;
              }}
            />
            {/* Status Badge floating on thumbnail for mobile screens */}
            <div className="absolute top-2.5 right-2.5 lg:hidden">
              <span
                className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold shadow-xs ${getStatusBadge(
                  status
                )}`}
              >
                {status}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3
              onClick={() => onViewDetails(event)}
              className="text-base sm:text-lg font-bold text-neutral-900 hover:text-red-600 transition cursor-pointer"
            >
              {event.title}
            </h3>

            {/* Date & Location Row */}
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 text-neutral-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{formatDateTime(event.date, event.time, event.endTime)}</span>
              </div>

              {event.location && (
                <div className="flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4 text-neutral-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {/* Tags Row */}
            {event.tags && event.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-lg bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 border border-neutral-200/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Status & Action Buttons (Side-by-side on mobile, no stacking!) */}
        <div className="flex items-center gap-2 sm:gap-2.5 pt-2 lg:pt-0 w-full lg:w-auto shrink-0">
          {/* Desktop Status Badge (hidden on mobile, shown on thumbnail on mobile) */}
          <span
            className={`hidden lg:inline-flex items-center rounded-xl px-3.5 py-2 text-xs font-semibold shrink-0 ${getStatusBadge(
              status
            )}`}
          >
            {status}
          </span>

          {/* View Details Button */}
          <button
            type="button"
            onClick={() => onViewDetails(event)}
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-neutral-300 bg-white px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-900 transition cursor-pointer shadow-2xs"
            title="View full event details & RSVPs"
          >
            <svg
              className="h-4 w-4 text-neutral-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="whitespace-nowrap">View Details</span>
          </button>

          {/* Fill RSVP Button */}
          <button
            type="button"
            onClick={() => onConfirmAttendance(event)}
            className={`flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-4.5 py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs ${
              timeHasChanged
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : userAttendee?.status === "yes"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : userAttendee?.status === "maybe"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-neutral-900 hover:bg-neutral-800 text-white"
            }`}
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <span className="whitespace-nowrap">
              {timeHasChanged
                ? "Acknowledge"
                : userAttendee
                ? userAttendee.status === "yes"
                  ? "Attending ✓"
                  : userAttendee.status === "maybe"
                  ? "Maybe ?"
                  : "Change RSVP"
                : "Fill RSVP"}
            </span>
          </button>

          {/* Creator actions */}
          {isCreator && (
            <div className="flex items-center gap-1.5 border-l border-neutral-200 pl-2 sm:pl-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 transition cursor-pointer shadow-2xs"
                title="Edit Event"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => onDelete(event.id, event.title)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition cursor-pointer shadow-2xs"
                title="Delete Event"
              >
                🗑
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid card variant (for My Events / grid views)
  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white shadow-xs hover:border-neutral-300 hover:shadow-md transition overflow-hidden">
      {/* Thumbnail */}
      <div
        onClick={() => onViewDetails(event)}
        className="relative h-48 w-full cursor-pointer overflow-hidden border-b border-neutral-100"
      >
        <img
          src={event.imageUrl || fallbackImage}
          alt={event.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-semibold shadow-xs ${getStatusBadge(
              status
            )}`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onViewDetails(event)}
            className="text-base sm:text-lg font-bold text-neutral-900 hover:text-red-600 transition cursor-pointer"
          >
            {event.title}
          </h3>

          <div className="mt-2 flex flex-col gap-1.5 text-xs sm:text-sm text-neutral-500">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDateTime(event.date, event.time, event.endTime)}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-medium ${getTagStyle(tag)}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card actions: View Details + Fill RSVP side-by-side in one row + Creator actions */}
        <div className="mt-6 flex items-center gap-2 border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={() => onViewDetails(event)}
            className="flex-1 inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition cursor-pointer shadow-2xs"
          >
            View Details
          </button>

          <button
            type="button"
            onClick={() => onConfirmAttendance(event)}
            className={`flex-1 inline-flex items-center justify-center rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs ${
              userAttendee?.status === "yes"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : userAttendee?.status === "maybe"
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            {userAttendee
              ? userAttendee.status === "yes"
                ? "Attending ✓"
                : userAttendee.status === "maybe"
                ? "Maybe ?"
                : "Change RSVP"
              : "Fill RSVP"}
          </button>

          {isCreator && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
                title="Edit"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => onDelete(event.id, event.title)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                title="Delete"
              >
                🗑
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
