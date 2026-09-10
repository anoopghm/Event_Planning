import Modal from "../ui/Modal";
import Button from "../ui/Button";
import type { EventItem, Attendee } from "../../types";


interface ConfirmAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  currentAttendee?: Attendee | null;
  onConfirm: (decision: "yes" | "no") => void;
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
                  <strong>{event.date} at {event.time}</strong>. Please
                  acknowledge this new time and confirm whether you will still
                  attend.
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
            🗓 <strong>{event.date}</strong> at <strong>{event.time}</strong>
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
              Current decision:{" "}
              <span
                className={`font-semibold ${
                  currentAttendee?.status === "yes"
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {currentAttendee?.status === "yes"
                  ? "✓ Attending (Yes)"
                  : "✕ Not Attending (No)"}
              </span>
              . You can change your choice below.
            </p>
          )}
        </div>

        {/* Action Buttons: Yes / No */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => onConfirm("yes")}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-800 transition hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer"
          >
            <span className="text-lg">✓</span>
            <span className="text-sm font-bold">Yes, I will attend</span>
          </button>

          <button
            type="button"
            onClick={() => onConfirm("no")}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 transition hover:bg-red-100 hover:border-red-300 cursor-pointer"
          >
            <span className="text-lg">✕</span>
            <span className="text-sm font-bold">No, I can't make it</span>
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
