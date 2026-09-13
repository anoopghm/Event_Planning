import {
  Calendar,
  MapPin,
  Users,
  Eye,
  Pencil,
  Trash2,
  Lock,
  Globe,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";
import {
  formatDateTime,
  getTagStyle,
  getEffectiveEventStatus,
  getStatusBadge,
  getStatusText,
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
    (a) =>
      String(a.userId) === String(currentUser.id) ||
      a.userId === "currentUser" ||
      (currentUser.email && a.userEmail === currentUser.email)
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

  const yesAttendeesCount = event.attendees?.filter((a) => a.status === "yes").length || 0;
  const totalRsvpCount = event.attendees?.length || 0;

  const fallbackImage =
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80";

  // Design row layout (matches dashboard list)
  if (variant === "row") {
    return (
      <div className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-md lg:flex-row lg:items-center lg:justify-between">
        {/* Left Section: Thumbnail + Info */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1 min-w-0">
          {/* Thumbnail */}
          <div
            onClick={() => onViewDetails(event)}
            className="relative h-32 sm:h-28 w-full shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-100 sm:w-48 md:w-52 bg-slate-100"
          >
            <img
              src={event.imageUrl || fallbackImage}
              alt={event.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImage;
              }}
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={() => onViewDetails(event)}
                className="text-base sm:text-lg font-bold text-slate-900 hover:text-rose-600 transition cursor-pointer"
              >
                {event.title}
              </h3>

              {/* Public/Private Pill */}
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                  event.eventType === "Private"
                    ? "bg-amber-50 text-amber-800 border-amber-200/70"
                    : "bg-blue-50 text-blue-700 border-blue-200/70"
                }`}
              >
                {event.eventType === "Private" ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Globe className="h-3 w-3" />
                )}
                <span>{event.eventType === "Private" ? "Private" : "Public"}</span>
              </span>

              {/* Single clean status badge */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-semibold border ${getStatusBadge(
                  status
                )}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    status === "Ongoing"
                      ? "bg-emerald-500 animate-pulse"
                      : status === "Upcoming"
                      ? "bg-indigo-500"
                      : "bg-slate-400"
                  }`}
                />
                {getStatusText(status)}
              </span>
            </div>

            {/* Date, Location & Attendees Row (removed duplicate "Status: Past Event" text) */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-700">
                  {formatDateTime(event.date, event.time, event.endTime)}
                </span>
              </div>

              {event.location && (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{event.location}</span>
                  </div>
                </>
              )}

              <span className="text-slate-300">•</span>

              <div
                className="flex items-center gap-1.5 text-slate-600"
                title={`${yesAttendeesCount} confirmed attending (${totalRsvpCount} total responses)`}
              >
                <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-[11px] sm:text-xs">
                  {yesAttendeesCount} attending
                  {totalRsvpCount > yesAttendeesCount && ` (${totalRsvpCount} responded)`}
                </span>
              </div>
            </div>

            {/* Tags Row */}
            {event.tags && event.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium border ${getTagStyle(
                      tag
                    )}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 pt-2 lg:pt-0 w-full lg:w-auto shrink-0">
          {/* View Details Button */}
          <button
            type="button"
            onClick={() => onViewDetails(event)}
            className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition cursor-pointer shadow-2xs"
            title="View full event details & RSVPs"
          >
            <Eye className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="whitespace-nowrap">View Details</span>
          </button>

          {/* RSVP Button */}
          <button
            type="button"
            onClick={() => onConfirmAttendance(event)}
            className={`flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 sm:px-4.5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs ${
              timeHasChanged
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : status === "Past"
                ? userAttendee?.status === "yes"
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/80 shadow-2xs"
                : userAttendee?.status === "yes"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : userAttendee?.status === "maybe"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            {timeHasChanged ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-white" />
            ) : userAttendee?.status === "yes" ? (
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${status === "Past" ? "text-emerald-600" : "text-white"}`} />
            ) : (
              <CalendarCheck className="h-4 w-4 shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {timeHasChanged
                ? "Acknowledge"
                : status === "Past"
                ? userAttendee?.status === "yes"
                  ? "Attended ✓"
                  : userAttendee
                  ? "Past RSVP"
                  : "Past Event"
                : userAttendee
                ? userAttendee.status === "yes"
                  ? "Attending ✓"
                  : userAttendee.status === "maybe"
                  ? "Maybe ?"
                  : "Change RSVP"
                : "Fill RSVP"}
            </span>
          </button>

          {/* Creator actions: sleek vector icons */}
          {isCreator && (
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 sm:pl-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                title="Edit Event"
                aria-label="Edit Event"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(event.id, event.title)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer shadow-2xs"
                title="Delete Event"
                aria-label="Delete Event"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid card variant (for My Events / grid views)
  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 hover:shadow-md transition overflow-hidden">
      {/* Thumbnail */}
      <div
        onClick={() => onViewDetails(event)}
        className="relative h-48 w-full cursor-pointer overflow-hidden border-b border-slate-100 bg-slate-100"
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
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold shadow-xs backdrop-blur-xs ${getStatusBadge(
              status
            )}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === "Ongoing"
                  ? "bg-emerald-500 animate-pulse"
                  : status === "Upcoming"
                  ? "bg-indigo-500"
                  : "bg-slate-400"
              }`}
            />
            {getStatusText(status)}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              onClick={() => onViewDetails(event)}
              className="text-base sm:text-lg font-bold text-slate-900 hover:text-rose-600 transition cursor-pointer"
            >
              {event.title}
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                event.eventType === "Private"
                  ? "bg-amber-50 text-amber-800 border-amber-200/70"
                  : "bg-blue-50 text-blue-700 border-blue-200/70"
              }`}
            >
              {event.eventType === "Private" ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Globe className="h-3 w-3" />
              )}
              <span>{event.eventType === "Private" ? "Private" : "Public"}</span>
            </span>
          </div>

          <div className="mt-2.5 flex flex-col gap-1.5 text-xs sm:text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">
                {formatDateTime(event.date, event.time, event.endTime)}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}

            <div
              className="flex items-center gap-1.5 text-xs text-slate-600"
              title={`${yesAttendeesCount} confirmed attending (${totalRsvpCount} total responses)`}
            >
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium">
                {yesAttendeesCount} attending
                {totalRsvpCount > yesAttendeesCount && ` (${totalRsvpCount} responded)`}
              </span>
            </div>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-medium border ${getTagStyle(
                    tag
                  )}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card actions */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => onViewDetails(event)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer shadow-2xs"
          >
            <Eye className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Details</span>
          </button>

          <button
            type="button"
            onClick={() => onConfirmAttendance(event)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs ${
              status === "Past"
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-2xs"
                : userAttendee?.status === "yes"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : userAttendee?.status === "maybe"
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {userAttendee?.status === "yes" && <CheckCircle2 className="h-4 w-4" />}
            <span>
              {status === "Past"
                ? userAttendee?.status === "yes"
                  ? "Attended ✓"
                  : "Past Event"
                : userAttendee
                ? userAttendee.status === "yes"
                  ? "Attending ✓"
                  : userAttendee.status === "maybe"
                  ? "Maybe ?"
                  : "Change RSVP"
                : "Fill RSVP"}
            </span>
          </button>

          {isCreator && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                title="Edit"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(event.id, event.title)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition cursor-pointer shadow-2xs"
                title="Delete"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
