import { useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Pencil,
  Lock,
  Globe,
  Check,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  X,
  CalendarCheck,
} from "lucide-react";
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
    (a) =>
      String(a.userId) === String(currentUser.id) ||
      a.userId === "currentUser" ||
      (currentUser.email && a.userEmail === currentUser.email)
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
          <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100">
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
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold shadow-xs backdrop-blur-xs ${getStatusBadge(
                  effectiveStatus
                )}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    effectiveStatus === "Ongoing"
                      ? "bg-emerald-500 animate-pulse"
                      : effectiveStatus === "Upcoming"
                      ? "bg-indigo-500"
                      : "bg-slate-400"
                  }`}
                />
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
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    effectiveStatus === "Ongoing"
                      ? "bg-emerald-500 animate-pulse"
                      : effectiveStatus === "Upcoming"
                      ? "bg-indigo-500"
                      : "bg-slate-400"
                  }`}
                />
                {getStatusText(effectiveStatus)}
              </span>
            </div>
          )}

          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {event.title}
          </h2>

          {/* Metadata chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-3 py-1.5 border border-slate-200/60">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>{formatDateTime(event.date, event.time, event.endTime)}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-3 py-1.5 border border-slate-200/60">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-3 py-1.5 border border-slate-200/60">
              {event.eventType === "Private" ? (
                <Lock className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-blue-600" />
              )}
              <span>{event.eventType === "Private" ? "Private Event" : "Public Event"}</span>
            </div>

            {event.creatorName && (
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-3 py-1.5 border border-slate-200/60">
                <Users className="h-3.5 w-3.5 text-slate-500" />
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
                  className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-medium border ${getTagStyle(tag)}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            About This Event
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
            {event.description || "No description provided for this event."}
          </p>
        </div>

        {/* Integrated RSVP & Attendees Section with 3 Options */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Attendee RSVPs ({attendees.length})
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {userAttendee ? (
                  <span>
                    Your RSVP status:{" "}
                    <strong
                      className={
                        userAttendee.status === "yes"
                          ? "text-emerald-600 font-bold"
                          : userAttendee.status === "maybe"
                          ? "text-amber-600 font-bold"
                          : "text-rose-600 font-bold"
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
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/70">
              <button
                type="button"
                onClick={() => setRsvpTab("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  rsvpTab === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
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
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Check className="h-3 w-3" />
                <span>Yes</span>
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
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <HelpCircle className="h-3 w-3" />
                <span>Maybe</span>
                <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                  {maybeList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRsvpTab("no")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  rsvpTab === "no"
                    ? "bg-white text-rose-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <X className="h-3 w-3" />
                <span>No</span>
                <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-600">
                  {noList.length}
                </span>
              </button>
            </div>
          </div>

          {/* Attendees List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
            {displayedAttendees.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {attendees.length === 0
                  ? "No attendees have responded to this event yet."
                  : rsvpTab === "yes"
                  ? "No attendees have confirmed 'Yes' yet."
                  : rsvpTab === "maybe"
                  ? "No attendees have responded 'Maybe' yet."
                  : "No attendees have declined."}
              </div>
            ) : (
              displayedAttendees.map((attendee) => {
                const isUser =
                  String(attendee.userId) === String(currentUser.id) ||
                  attendee.userId === "currentUser" ||
                  (currentUser.email && attendee.userEmail === currentUser.email);
                return (
                  <div
                    key={String(attendee.userId)}
                    className="flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-2xs ${
                          attendee.status === "yes"
                            ? "bg-gradient-to-tr from-emerald-600 to-emerald-500"
                            : attendee.status === "maybe"
                            ? "bg-gradient-to-tr from-amber-600 to-amber-500"
                            : "bg-gradient-to-tr from-slate-600 to-slate-500"
                        }`}
                      >
                        {attendee.userName ? attendee.userName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {attendee.userName}
                          </p>
                          {isUser && (
                            <span className="rounded-md bg-rose-50 border border-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {attendee.userEmail}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                          attendee.status === "yes"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                            : attendee.status === "maybe"
                            ? "bg-amber-50 text-amber-800 border-amber-200/80"
                            : "bg-rose-50 text-rose-700 border-rose-200/80"
                        }`}
                      >
                        {attendee.status === "yes" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                        {attendee.status === "maybe" && <Clock className="h-3.5 w-3.5 text-amber-600" />}
                        {attendee.status === "no" && <XCircle className="h-3.5 w-3.5 text-rose-600" />}
                        <span>
                          {attendee.status === "yes"
                            ? "Attending"
                            : attendee.status === "maybe"
                            ? "Tentative"
                            : "Declined"}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            {isCreator && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-2xs transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Event</span>
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
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>{userAttendee ? "Change RSVP" : "Fill RSVP"}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
