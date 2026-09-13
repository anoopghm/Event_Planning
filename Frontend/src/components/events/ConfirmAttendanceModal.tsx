import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Users,
  Check,
} from "lucide-react";
import Modal from "../ui/Modal";
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
  const isEditing = Boolean(currentAttendee);

  const [prevProps, setPrevProps] = useState({ isOpen, attendeeStatus: currentAttendee?.status });
  const [selectedStatus, setSelectedStatus] = useState<"yes" | "no" | "maybe">(
    currentAttendee?.status || "yes"
  );

  if (prevProps.isOpen !== isOpen || prevProps.attendeeStatus !== currentAttendee?.status) {
    setPrevProps({ isOpen, attendeeStatus: currentAttendee?.status });
    setSelectedStatus(currentAttendee?.status || "yes");
  }

  if (!isOpen || !event) return null;

  const yesCount = event.attendees?.filter((a) => a.status === "yes").length || 0;
  const maybeCount = event.attendees?.filter((a) => a.status === "maybe").length || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        timeHasChanged
          ? "Acknowledge New Schedule & RSVP"
          : isEditing
          ? "Update Your RSVP"
          : "Confirm Your Attendance"
      }
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Notice when time was updated */}
        {timeHasChanged && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 text-amber-900 shadow-2xs animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mt-0.5">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-950">
                  Event schedule has been updated!
                </p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  The organizer updated the schedule to{" "}
                  <strong className="font-semibold text-amber-950">
                    {formatDateTime(event.date, event.time, event.endTime)}
                  </strong>
                  . Please acknowledge this timing and confirm your RSVP.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Elevated Event Overview Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-slate-50/40 p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 border border-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 uppercase tracking-wide">
              Event Details
            </span>
            {event.creatorName && (
              <span className="text-[11px] text-slate-400 font-medium">
                Hosted by <strong className="text-slate-700">{event.creatorName}</strong>
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {event.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-0.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="font-semibold text-slate-800">
                {formatDateTime(event.date, event.time, event.endTime)}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-500" title={`${yesCount} attending, ${maybeCount} tentative`}>
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>
                {yesCount} attending{maybeCount > 0 ? ` • ${maybeCount} maybe` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Section Instruction */}
        <div className="pt-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Your Response
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose your attendance status for this event:
          </p>
        </div>

        {/* Professional RSVP Option Cards */}
        <div className="space-y-2.5">
          {/* Card 1: Yes */}
          <div
            onClick={() => setSelectedStatus("yes")}
            className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 cursor-pointer active:scale-[0.99] ${
              selectedStatus === "yes"
                ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                  selectedStatus === "yes"
                    ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-bold text-slate-900">
                    Yes, I'm attending
                  </h5>
                  {currentAttendee?.status === "yes" && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded-md">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm your attendance and reserve your spot
                </p>
              </div>
            </div>

            {/* Selection radio circle */}
            <div
              className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition ${
                selectedStatus === "yes"
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                  : "border-slate-300 bg-white"
              }`}
            >
              {selectedStatus === "yes" && <Check className="h-3 w-3 stroke-[3]" />}
            </div>
          </div>

          {/* Card 2: Maybe */}
          <div
            onClick={() => setSelectedStatus("maybe")}
            className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 cursor-pointer active:scale-[0.99] ${
              selectedStatus === "maybe"
                ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                  selectedStatus === "maybe"
                    ? "bg-amber-500 text-white shadow-xs shadow-amber-500/30"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <Clock className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-bold text-slate-900">
                    Maybe, tentative
                  </h5>
                  {currentAttendee?.status === "maybe" && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded-md">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Interested, but schedule is not confirmed yet
                </p>
              </div>
            </div>

            {/* Selection radio circle */}
            <div
              className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition ${
                selectedStatus === "maybe"
                  ? "border-amber-500 bg-amber-500 text-white shadow-2xs"
                  : "border-slate-300 bg-white"
              }`}
            >
              {selectedStatus === "maybe" && <Check className="h-3 w-3 stroke-[3]" />}
            </div>
          </div>

          {/* Card 3: No */}
          <div
            onClick={() => setSelectedStatus("no")}
            className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 cursor-pointer active:scale-[0.99] ${
              selectedStatus === "no"
                ? "border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                  selectedStatus === "no"
                    ? "bg-rose-600 text-white shadow-xs shadow-rose-600/30"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                <XCircle className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-bold text-slate-900">
                    No, can't attend
                  </h5>
                  {currentAttendee?.status === "no" && (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/90 px-1.5 py-0.2 rounded-md">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Decline invitation and let organizer know
                </p>
              </div>
            </div>

            {/* Selection radio circle */}
            <div
              className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition ${
                selectedStatus === "no"
                  ? "border-rose-600 bg-rose-600 text-white shadow-2xs"
                  : "border-slate-300 bg-white"
              }`}
            >
              {selectedStatus === "no" && <Check className="h-3 w-3 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm(selectedStatus)}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition cursor-pointer shadow-xs active:scale-[0.98] ${
              selectedStatus === "yes"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                : selectedStatus === "maybe"
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
            }`}
          >
            {selectedStatus === "yes" && <CheckCircle2 className="h-4 w-4" />}
            {selectedStatus === "maybe" && <Clock className="h-4 w-4" />}
            {selectedStatus === "no" && <XCircle className="h-4 w-4" />}
            <span>
              {isEditing ? "Update RSVP" : "Confirm RSVP"}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
