import { useState } from "react";
import { Globe, Lock, Plus, Check, X } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { PRESET_TAGS } from "../../constants/mockData";
import { computeEventStatus, getStatusBadge } from "../../utils/eventUtils";
import { optimizeCloudinaryUrl } from "../../utils/cloudinary";
import type { EventItem, Attendee } from "../../types";

export type { EventItem, Attendee };

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newEvent: Omit<EventItem, "id">) => void;
  eventToEdit?: EventItem | null;
  onUpdate?: (updatedEvent: EventItem) => void;
}

interface EventFormContentProps {
  eventToEdit?: EventItem | null;
  onSubmit: (newEvent: Omit<EventItem, "id">) => void;
  onUpdate?: (updatedEvent: EventItem) => void;
  onClose: () => void;
}

function EventFormContent({
  eventToEdit,
  onSubmit,
  onUpdate,
  onClose,
}: EventFormContentProps) {
  const isEditMode = Boolean(eventToEdit);

  const [title, setTitle] = useState(eventToEdit?.title || "");
  const [description, setDescription] = useState(eventToEdit?.description || "");
  const [date, setDate] = useState(eventToEdit?.date || "");
  const [time, setTime] = useState(eventToEdit?.time || "");
  const [endTime, setEndTime] = useState(eventToEdit?.endTime || "");
  const [location, setLocation] = useState(eventToEdit?.location || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(eventToEdit?.tags || []);
  const [eventType, setEventType] = useState<"Public" | "Private">(
    eventToEdit?.eventType || "Public"
  );
  const [imageUrl, setImageUrl] = useState(eventToEdit?.imageUrl || "");
  const [customTagInput, setCustomTagInput] = useState("");
  const [error, setError] = useState("");

  const liveComputedStatus = date && time ? computeEventStatus(date, time, endTime) : "Upcoming";

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;

    const formattedTag =
      trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    if (!selectedTags.includes(formattedTag)) {
      setSelectedTags((prev) => [...prev, formattedTag]);
    }
    setCustomTagInput("");
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleFromTimeChange = (newFrom: string) => {
    setTime(newFrom);
    if (error) setError("");

    // Auto-suggest To (end) time 1 hour later if empty or earlier
    if (newFrom && !endTime) {
      try {
        const [h, m] = newFrom.split(":").map(Number);
        const endH = (h + 1) % 24;
        setEndTime(
          `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
      } catch {
        // ignore
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter an event title.");
      return;
    }

    if (!date) {
      setError("Please select a date for the event.");
      return;
    }

    if (!time) {
      setError("Please enter a From (start) time for the event.");
      return;
    }

    if (!endTime) {
      setError("Please enter a To (end) time for the event.");
      return;
    }

    if (time && endTime && endTime <= time) {
      setError("To (end) time must be later than From (start) time.");
      return;
    }

    const getAutoImageForTags = (tags: string[]) => {
      const lower = tags.map((t) => t.toLowerCase()).join(" ");
      if (lower.includes("birth"))
        return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80";
      if (lower.includes("conf") || lower.includes("tech"))
        return "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80";
      if (lower.includes("meet") || lower.includes("trek") || lower.includes("hike"))
        return "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80";
      if (lower.includes("work"))
        return "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80";
      if (lower.includes("party") || lower.includes("gala"))
        return "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80";
      return "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=80";
    };

    const rawImageUrl =
      imageUrl.trim() || eventToEdit?.imageUrl || getAutoImageForTags(selectedTags);
    const finalImageUrl = optimizeCloudinaryUrl(rawImageUrl);

    const computedStatus = computeEventStatus(date, time, endTime);

    if (isEditMode && eventToEdit) {
      if (onUpdate) {
        const timeChanged =
          eventToEdit.date !== date ||
          eventToEdit.time !== time ||
          eventToEdit.endTime !== endTime;

        onUpdate({
          id: eventToEdit.id,
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          endTime,
          location: location.trim() || undefined,
          tags: selectedTags,
          status: computedStatus,
          eventType,
          imageUrl: finalImageUrl,
          creatorId: eventToEdit.creatorId,
          creatorName: eventToEdit.creatorName,
          creatorEmail: eventToEdit.creatorEmail,
          attendees: eventToEdit.attendees || [],
          lastTimeUpdated: timeChanged
            ? new Date().toISOString()
            : eventToEdit.lastTimeUpdated,
        });
      }
    } else {
      onSubmit({
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        endTime,
        location: location.trim() || undefined,
        tags: selectedTags,
        status: computedStatus,
        eventType,
        imageUrl: finalImageUrl,
        attendees: [],
      });
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-600 font-medium animate-in fade-in">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="event-title"
          className="block text-xs sm:text-sm font-semibold text-neutral-800"
        >
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          id="event-title"
          type="text"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError("");
          }}
          placeholder="e.g. Q3 Sprint Planning, Tech Conference 2026"
          className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
        />
      </div>

      {/* Meeting Date & Timings (From and To) */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Meeting Schedule & Timings
          </span>
          {date && time && (
            <span
              className={`inline-flex items-center rounded-xl px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(
                liveComputedStatus
              )}`}
            >
              {liveComputedStatus}
            </span>
          )}
        </div>

        {/* Meeting Date */}
        <div>
          <label
            htmlFor="event-date"
            className="block text-xs font-medium text-neutral-700 mb-1"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="event-date"
            type="date"
            required
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (error) setError("");
            }}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
          />
        </div>

        {/* From (Start Time) and To (End Time) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="event-from-time"
              className="block text-xs font-medium text-neutral-700 mb-1"
            >
              From (Start Time) <span className="text-red-500">*</span>
            </label>
            <input
              id="event-from-time"
              type="time"
              required
              value={time}
              onChange={(e) => handleFromTimeChange(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="event-to-time"
              className="block text-xs font-medium text-neutral-700 mb-1"
            >
              To (End Time) <span className="text-red-500">*</span>
            </label>
            <input
              id="event-to-time"
              type="time"
              required
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                if (error) setError("");
              }}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
            />
          </div>
        </div>

        <p className="text-[11px] text-neutral-400">
          Status (Upcoming, Ongoing, or Past) is calculated automatically based on these timings.
        </p>
      </div>

        {/* Event Type: Public vs Private */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
          Event Access Type <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setEventType("Public")}
            className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
              eventType === "Public"
                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${eventType === "Public" ? "bg-white/10 text-white" : "bg-blue-50 text-blue-600"}`}>
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold">Public Event</p>
              <p
                className={`text-[11px] mt-0.5 ${
                  eventType === "Public" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Open to all users to discover and RSVP
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setEventType("Private")}
            className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
              eventType === "Private"
                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${eventType === "Private" ? "bg-white/10 text-white" : "bg-amber-50 text-amber-600"}`}>
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold">Private Event</p>
              <p
                className={`text-[11px] mt-0.5 ${
                  eventType === "Private" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Restricted to invited guests only
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="event-description"
          className="block text-xs sm:text-sm font-semibold text-slate-800"
        >
          Description
        </label>
        <textarea
          id="event-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief details about the meeting agenda, venue instructions, or notes..."
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 resize-none shadow-2xs"
        />
      </div>

      {/* Location (Optional) */}
      <div>
        <label
          htmlFor="event-location"
          className="block text-xs sm:text-sm font-semibold text-slate-800"
        >
          Location / Venue <span className="text-xs font-normal text-slate-400">(Optional)</span>
        </label>
        <input
          id="event-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Conference Room 3B, Online (Google Meet / Zoom)"
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 shadow-2xs"
        />
      </div>

      {/* Image URL (Optional) */}
      <div>
        <label
          htmlFor="event-image-url"
          className="block text-xs sm:text-sm font-semibold text-slate-800"
        >
          Image URL <span className="text-xs font-normal text-slate-400">(Optional - auto-assigned if empty)</span>
        </label>
        <input
          id="event-image-url"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          onBlur={() => {
            if (imageUrl.trim()) {
              setImageUrl(optimizeCloudinaryUrl(imageUrl.trim()));
            }
          }}
          placeholder="e.g. Cloudinary link or https://images.unsplash.com/photo-..."
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 shadow-2xs"
        />
      </div>

      {/* Tags */}
      <div className="pt-1">
        <label className="block text-xs sm:text-sm font-semibold text-slate-800">
          Tags / Categories
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Select presets or enter custom tags for quick filtering.
        </p>

        {/* Quick presets */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {PRESET_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                <span>{tag}</span>
              </button>
            );
          })}
        </div>

        {/* Custom tag input */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={handleCustomTagKeyDown}
            placeholder="Add custom tag (e.g. Sprint, Sync)..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 shadow-2xs"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
          >
            Add Tag
          </button>
        </div>

        {/* Selected tags badges */}
        {selectedTags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-2.5">
            <span className="text-xs font-medium text-slate-500 mr-1">
              Selected:
            </span>
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-rose-900 focus:outline-hidden cursor-pointer"
                  title={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>
          {isEditMode ? "Cancel" : "Back to Dashboard"}
        </Button>
        <Button type="submit" variant="primary">
          {isEditMode ? "Save Changes" : "Create Event"}
        </Button>
      </div>
    </form>
  );
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
  eventToEdit = null,
  onUpdate,
}: CreateEventModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? "Edit Event" : "Create New Event"}
      maxWidth="max-w-xl"
    >
      <EventFormContent
        key={eventToEdit ? eventToEdit.id : "new-event"}
        eventToEdit={eventToEdit}
        onSubmit={onSubmit}
        onUpdate={onUpdate}
        onClose={onClose}
      />
    </Modal>
  );
}
