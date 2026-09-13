import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import type { EventItem } from "../../types";


interface AttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
}

export default function AttendeesModal({
  isOpen,
  onClose,
  event,
}: AttendeesModalProps) {
  const [activeTab, setActiveTab] = useState<"yes" | "maybe" | "no">("yes");

  if (!isOpen || !event) return null;

  const attendees = event.attendees || [];
  const yesList = attendees.filter((a) => a.status === "yes");
  const maybeList = attendees.filter((a) => a.status === "maybe");
  const noList = attendees.filter((a) => a.status === "no");

  const displayedList =
    activeTab === "yes" ? yesList : activeTab === "maybe" ? maybeList : noList;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event RSVP Responses"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Event Header Summary */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5">
          <h3 className="text-sm font-bold text-neutral-900">{event.title}</h3>
          <p className="text-xs text-neutral-500">
            🗓 {event.date} at {event.time}
            {event.location && ` • 📍 ${event.location}`}
          </p>
          {event.creatorName && (
            <p className="mt-1 text-[11px] text-neutral-400">
              Organizer: <span className="font-semibold text-neutral-600">{event.creatorName}</span>
            </p>
          )}
        </div>

        {/* Tabs: Attending (Yes) vs Tentative (Maybe) vs Not Attending (No) */}
        <div className="flex rounded-xl bg-neutral-100 p-1 border border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab("yes")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === "yes"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <span>✓ Yes</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              {yesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("maybe")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === "maybe"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <span>? Maybe</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
              {maybeList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("no")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === "no"
                ? "bg-white text-red-600 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <span>✕ No</span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">
              {noList.length}
            </span>
          </button>
        </div>

        {/* List of Attendees */}
        <div className="min-h-[160px] max-h-[300px] overflow-y-auto divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
          {displayedList.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-400">
              {activeTab === "yes"
                ? "No attendees have confirmed 'Yes' yet."
                : activeTab === "maybe"
                ? "No attendees have responded 'Maybe' yet."
                : "No users have responded 'No'."}
            </div>
          ) : (
            displayedList.map((attendee) => (
              <div
                key={String(attendee.userId)}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${
                      attendee.status === "yes"
                        ? "bg-emerald-500"
                        : attendee.status === "maybe"
                        ? "bg-amber-500"
                        : "bg-neutral-400"
                    }`}
                  >
                    {attendee.userName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-800">
                      {attendee.userName}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {attendee.userEmail}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      attendee.status === "yes"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : attendee.status === "maybe"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {attendee.status === "yes"
                      ? "Attending"
                      : attendee.status === "maybe"
                      ? "Maybe"
                      : "Declined"}
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

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
          <p className="text-xs text-neutral-400">
            Total responses: {attendees.length}
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
