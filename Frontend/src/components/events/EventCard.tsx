import { formatDateTime, getTagStyle, getStatusBadge } from "../../utils/eventUtils";
import type { EventItem, AuthUser } from "../../types";

interface EventCardProps {
  event: EventItem;
  currentUser: AuthUser;
  onEdit: (event: EventItem) => void;
  onDelete: (id: string, title: string) => void;
  onConfirmAttendance: (event: EventItem) => void;
  onViewAttendees: (event: EventItem) => void;
  variant?: "card" | "row";
}

export default function EventCard({
  event,
  currentUser,
  onEdit,
  onDelete,
  onConfirmAttendance,
  onViewAttendees,
  variant = "card",
}: EventCardProps) {
  const isCreator = String(event.creatorId) === String(currentUser.id);
  const userAttendee = event.attendees?.find(
    (a) => String(a.userId) === String(currentUser.id)
  );
  const eventSchedule = `${event.date} ${event.time}`;
  const timeHasChanged = Boolean(
    userAttendee &&
      userAttendee.acknowledgedTime &&
      userAttendee.acknowledgedTime !== eventSchedule
  );

  const yesCount =
    event.attendees?.filter((a) => a.status === "yes").length || 0;
  const noCount =
    event.attendees?.filter((a) => a.status === "no").length || 0;

  if (variant === "row") {
    return (
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-neutral-50/60 rounded-xl px-2.5 transition">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-800">
              {event.title}
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.2 text-[10px] font-medium ${getStatusBadge(
                event.status
              )}`}
            >
              {event.status || "Upcoming"}
            </span>

            {isCreator ? (
              <span className="text-[10px] font-medium text-neutral-400">
                (Your Event)
              </span>
            ) : userAttendee ? (
              <span
                className={`text-[10px] font-semibold ${
                  userAttendee.status === "yes"
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                • RSVP: {userAttendee.status === "yes" ? "Yes" : "No"}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-amber-600">
                • Awaiting your RSVP
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-500 mt-0.5">
            {formatDateTime(event.date, event.time)}
            {event.location && ` • ${event.location}`}
            {event.creatorName && ` • Organizer: ${event.creatorName}`}
          </p>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-medium ${getTagStyle(
                    tag
                  )}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Attendance summary */}
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => onViewAttendees(event)}
              className="text-[11px] font-medium text-neutral-500 hover:text-red-600 transition cursor-pointer"
            >
              👥 RSVPs: <span className="text-emerald-600 font-semibold">{yesCount} Yes</span> · <span className="text-red-500 font-semibold">{noCount} No</span> (Click to view)
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isCreator ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(event.id, event.title)}
                className="rounded-lg p-1.5 text-xs text-neutral-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                title="Delete event"
              >
                🗑
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onConfirmAttendance(event)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                timeHasChanged
                  ? "border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  : userAttendee
                  ? "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
                  : "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {timeHasChanged
                ? "⚠️ Confirm New Time"
                : userAttendee
                ? "Change Decision"
                : "Confirm"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Standard "card" variant
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs hover:border-neutral-300 hover:shadow-md transition">
      <div>
        {/* Top row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                event.status
              )}`}
            >
              {event.status || "Upcoming"}
            </span>

            {isCreator ? (
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                ⭐ You are Creator
              </span>
            ) : userAttendee ? (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  userAttendee.status === "yes"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {userAttendee.status === "yes"
                  ? "✓ Your RSVP: Attending"
                  : "✕ Your RSVP: Not Attending"}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                ⏳ RSVP Pending
              </span>
            )}
          </div>

          <span className="text-xs font-medium text-neutral-500">
            🗓 {formatDateTime(event.date, event.time)}
          </span>
        </div>

        {/* Time Changed Banner */}
        {!isCreator && timeHasChanged && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
            <p className="font-semibold">⚠️ Time Changed by Organizer</p>
            <p className="mt-0.5 text-[11px] text-amber-800">
              New schedule: {event.date} at {event.time}. Please review and update your confirmation.
            </p>
          </div>
        )}

        {/* Title */}
        <h3 className="mt-3 text-lg font-bold text-neutral-900">
          {event.title}
        </h3>

        {/* Location & Creator */}
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-medium text-neutral-500">
          {event.location && (
            <span className="flex items-center gap-1">
              <span>📍</span>
              <span>{event.location}</span>
            </span>
          )}
          {event.creatorName && (
            <span className="text-neutral-400">
              By: {event.creatorName} {isCreator && "(You)"}
            </span>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="mt-2.5 text-sm text-neutral-600 line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getTagStyle(
                  tag
                )}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Bottom Area: Attendees & Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-100 pt-4">
        {/* RSVP summary */}
        <button
          type="button"
          onClick={() => onViewAttendees(event)}
          className="flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-red-600 transition cursor-pointer text-left"
          title="Click to view full RSVP list"
        >
          <span className="text-sm">👥</span>
          <span>
            RSVPs:{" "}
            <strong className="text-emerald-600">{yesCount} Yes</strong> ·{" "}
            <strong className="text-red-500">{noCount} No</strong>
          </span>
          <span className="underline text-[11px] text-neutral-400">
            (View List)
          </span>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isCreator ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:text-neutral-900 transition cursor-pointer"
              >
                <span>✏️</span> Edit
              </button>

              <button
                type="button"
                onClick={() => onDelete(event.id, event.title)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition cursor-pointer"
              >
                <span>🗑️</span> Delete
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onConfirmAttendance(event)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                timeHasChanged
                  ? "border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  : userAttendee
                  ? "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                  : "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
              }`}
            >
              {timeHasChanged ? (
                <>
                  <span>⚠️</span> Review & Confirm New Time
                </>
              ) : userAttendee ? (
                <>
                  <span>✏️</span> Change Decision
                </>
              ) : (
                <>
                  <span>✓</span> Confirm Attendance
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
