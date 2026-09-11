import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { formatDateTime, getTagStyle, getStatusBadge, getEffectiveEventStatus, getStatusText } from "../../utils/eventUtils";
import type { EventItem, AuthUser } from "../../types";

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  currentUser: AuthUser;
  onConfirmAttendance: (event: EventItem) => void;
  onEdit?: (event: EventItem) => void;
}

export default function EventDetailsModal({
  isOpen,
  onClose,
  event,
  currentUser,
  onConfirmAttendance,
  onEdit,
}: EventDetailsModalProps) {
  const [rsvpTab, setRsvpTab] = useState<"all" | "yes" | "maybe" | "no">("all");

  if (!isOpen || !event) return null;

  const effectiveStatus = getEffectiveEventStatus(event);
  const isCreator = String(event.creatorId) === String(currentUser.id);
  const userAttendee = event.attendees?.find(
    (a) => String(a.userId) === String(currentUser.id)
  );

  const attendees = event.attendees || [];
  const yesList = attendees.filter((a) => a.status === "yes");
  const maybeList = attendees.filter((a) => a.status === "maybe");
  const noList = attendees.filter((a) => a.status === "no");

  const displayedAttendees =
    rsvpTab === "yes"
      ? yesList
      : rsvpTab === "maybe"
      ? maybeList
      : rsvpTab === "no"
      ? noList
      : attendees;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Details & RSVPs"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Cover Image */}
        {event.imageUrl && (
          <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-neutral-200">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80";
              }}
            />
            <div className="absolute top-3 right-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-xs ${getStatusBadge(
                  effectiveStatus
                )}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${effectiveStatus === "Ongoing" ? "bg-emerald-500 animate-pulse" : effectiveStatus === "Upcoming" ? "bg-indigo-500" : "bg-neutral-400"}`} />
                {getStatusText(effectiveStatus)}
              </span>
            </div>
          </div>
        )}

        {/* Title & Metadata */}
        <div>
          {!event.imageUrl && (
            <div className="mb-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold ${getStatusBadge(
                  effectiveStatus
                )}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${effectiveStatus === "Ongoing" ? "bg-emerald-500 animate-pulse" : effectiveStatus === "Upcoming" ? "bg-indigo-500" : "bg-neutral-400"}`} />
                {getStatusText(effectiveStatus)}
              </span>
            </div>
          )}

          <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
            {event.title}
          </h2>

          {/* Metadata chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs font-medium text-neutral-600">
            <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 border border-neutral-200/60">
              <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDateTime(event.date, event.time, event.endTime)}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 border border-neutral-200/60">
                <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 border border-neutral-200/60">
              <span>{event.eventType === "Private" ? "🔒 Private Event" : "🌐 Public Event"}</span>
            </div>

            {event.creatorName && (
              <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 border border-neutral-200/60">
                <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Organizer: {event.creatorName} {isCreator && "(You)"}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
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

        {/* Description Section */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            About This Event
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
            {event.description || "No description provided for this event."}
          </p>
        </div>

        {/* Integrated RSVP & Attendees Section with 3 Options */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-neutral-100">
            <div>
              <h4 className="text-sm font-bold text-neutral-900">
                Attendee RSVPs ({attendees.length})
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                {userAttendee ? (
                  <span>
                    Your RSVP status:{" "}
                    <strong
                      className={
                        userAttendee.status === "yes"
                          ? "text-emerald-600 font-bold"
                          : userAttendee.status === "maybe"
                          ? "text-amber-600 font-bold"
                          : "text-red-600 font-bold"
                      }
                    >
                      {userAttendee.status === "yes"
                        ? "Confirmed YES ✓"
                        : userAttendee.status === "maybe"
                        ? "Tentative MAYBE ?"
                        : "Declined NO ✕"}
                    </strong>
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    You haven't responded yet.
                  </span>
                )}
              </p>
            </div>

            {/* 3 RSVP Filter Tabs + All */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-neutral-100 p-1 border border-neutral-200">
              <button
                type="button"
                onClick={() => setRsvpTab("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  rsvpTab === "all"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                All ({attendees.length})
              </button>
              <button
                type="button"
                onClick={() => setRsvpTab("yes")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  rsvpTab === "yes"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <span>✓ Yes</span>
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                  {yesList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRsvpTab("maybe")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  rsvpTab === "maybe"
                    ? "bg-white text-amber-700 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <span>? Maybe</span>
                <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                  {maybeList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRsvpTab("no")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  rsvpTab === "no"
                    ? "bg-white text-red-600 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <span>✕ No</span>
                <span className="rounded-full bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-600">
                  {noList.length}
                </span>
              </button>
            </div>
          </div>

          {/* Attendees List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-neutral-50/50">
            {displayedAttendees.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                {attendees.length === 0
                  ? "No attendees have responded to this event yet."
                  : rsvpTab === "yes"
                  ? "No attendees have confirmed 'Yes' yet."
                  : rsvpTab === "maybe"
                  ? "No attendees have responded 'Maybe' yet."
                  : "No attendees have declined."}
              </div>
            ) : (
              displayedAttendees.map((attendee) => (
                <div
                  key={String(attendee.userId)}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-neutral-50/70 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-2xs ${
                        attendee.status === "yes"
                          ? "bg-emerald-500"
                          : attendee.status === "maybe"
                          ? "bg-amber-500"
                          : "bg-neutral-400"
                      }`}
                    >
                      {attendee.userName ? attendee.userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 truncate">
                        {attendee.userName} {String(attendee.userId) === String(currentUser.id) && "(You)"}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {attendee.userEmail}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        attendee.status === "yes"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : attendee.status === "maybe"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {attendee.status === "yes"
                        ? "Attending ✓"
                        : attendee.status === "maybe"
                        ? "Maybe ?"
                        : "Declined ✕"}
                    </span>
                    {attendee.acknowledgedTime && (
                      <p className="mt-0.5 text-[10px] text-neutral-400">
                        Ack: {attendee.acknowledgedTime}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
          <div>
            {isCreator && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 cursor-pointer shadow-2xs transition"
              >
                ✏️ Edit Event
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onConfirmAttendance(event);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-neutral-800 transition cursor-pointer shadow-xs"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>{userAttendee ? "Change RSVP" : "Fill RSVP"}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
