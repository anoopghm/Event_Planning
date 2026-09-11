import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { formatDateTime } from "../../utils/eventUtils";
import type { EventItem, Attendee } from "../../types";

interface ConfirmAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  currentAttendee?: Attendee | null;
  onConfirm: (decision: "yes" | "no" | "maybe") => void;
  timeHasChanged?: boolean;
}

export default function ConfirmAttendanceModal({
  isOpen,
  onClose,
  event,
  currentAttendee,
  onConfirm,
  timeHasChanged = false,
}: ConfirmAttendanceModalProps) {
  if (!isOpen || !event) return null;

  const isEditing = Boolean(currentAttendee);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        timeHasChanged
          ? "Acknowledge New Time & Confirm RSVP"
          : isEditing
          ? "Edit Attendance Confirmation"
          : "Confirm Attendance"
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Notice when time was updated */}
        {timeHasChanged && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-900">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">⚠️</span>
              <div className="text-xs">
                <p className="font-semibold text-amber-950">
                  Event schedule has been updated!
                </p>
                <p className="mt-0.5 text-amber-800">
                  The organizer updated the schedule to{" "}
                  <strong>{formatDateTime(event.date, event.time, event.endTime)}</strong>. Please
                  acknowledge this new time and confirm your RSVP.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Event Preview */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
            Event Details
          </span>
          <h3 className="mt-1 text-base font-bold text-neutral-900">
            {event.title}
          </h3>
          <p className="mt-1 text-xs text-neutral-600">
            🗓 <strong>{formatDateTime(event.date, event.time, event.endTime)}</strong>
          </p>
          {event.location && (
            <p className="text-xs text-neutral-500">📍 {event.location}</p>
          )}
          {event.creatorName && (
            <p className="mt-1 text-[11px] text-neutral-400">
              Organized by {event.creatorName}
            </p>
          )}
        </div>

        {/* Main Question */}
        <div className="pt-1 text-center">
          <p className="text-base font-semibold text-neutral-900">
            Will you be attending the event?
          </p>

          {isEditing && (
            <p className="mt-1 text-xs text-neutral-500">
              Current choice:{" "}
              <span
                className={`font-semibold ${
                  currentAttendee?.status === "yes"
                    ? "text-emerald-600"
                    : currentAttendee?.status === "maybe"
                    ? "text-amber-600"
                    : "text-red-500"
                }`}
              >
                {currentAttendee?.status === "yes"
                  ? "✓ Attending (Yes)"
                  : currentAttendee?.status === "maybe"
                  ? "? Tentative (Maybe)"
                  : "✕ Not Attending (No)"}
              </span>
              . You can change your choice below.
            </p>
          )}
        </div>

        {/* Action Buttons: Yes / Maybe / No (3 options) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
          {/* Option 1: Yes */}
          <button
            type="button"
            onClick={() => onConfirm("yes")}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 sm:py-3.5 transition cursor-pointer active:scale-95 ${
              currentAttendee?.status === "yes"
                ? "border-emerald-500 bg-emerald-100/70 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs"
                : "border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400"
            }`}
          >
            <span className="text-xl">✓</span>
            <span className="text-sm font-bold">Yes</span>
            <span className="text-[10px] text-emerald-700 hidden sm:inline">
              Attending
            </span>
          </button>

          {/* Option 2: Maybe */}
          <button
            type="button"
            onClick={() => onConfirm("maybe")}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 sm:py-3.5 transition cursor-pointer active:scale-95 ${
              currentAttendee?.status === "maybe"
                ? "border-amber-500 bg-amber-100/70 text-amber-900 ring-2 ring-amber-500/20 shadow-xs"
                : "border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100 hover:border-amber-400"
            }`}
          >
            <span className="text-xl">?</span>
            <span className="text-sm font-bold">Maybe</span>
            <span className="text-[10px] text-amber-700 hidden sm:inline">
              Tentative
            </span>
          </button>

          {/* Option 3: No */}
          <button
            type="button"
            onClick={() => onConfirm("no")}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 sm:py-3.5 transition cursor-pointer active:scale-95 ${
              currentAttendee?.status === "no"
                ? "border-red-500 bg-red-100/70 text-red-900 ring-2 ring-red-500/20 shadow-xs"
                : "border-red-200 bg-red-50/70 text-red-800 hover:bg-red-100 hover:border-red-300"
            }`}
          >
            <span className="text-xl">✕</span>
            <span className="text-sm font-bold">No</span>
            <span className="text-[10px] text-red-700 hidden sm:inline">
              Can't make it
            </span>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="pt-2 border-t border-neutral-100 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
