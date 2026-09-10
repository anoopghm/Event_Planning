import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { PRESET_TAGS, STATUS_OPTIONS } from "../../constants/mockData";
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
  const [location, setLocation] = useState(eventToEdit?.location || "");
  const [status, setStatus] = useState<"Confirmed" | "Planning in Progress" | "Upcoming">(
    eventToEdit?.status || "Upcoming"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(eventToEdit?.tags || []);
  const [customTagInput, setCustomTagInput] = useState("");
  const [error, setError] = useState("");

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
      setError("Please select a start time for the event.");
      return;
    }

    if (isEditMode && eventToEdit) {
      if (onUpdate) {
        const timeChanged =
          eventToEdit.date !== date || eventToEdit.time !== time;

        onUpdate({
          id: eventToEdit.id,
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          location: location.trim() || undefined,
          tags: selectedTags,
          status,
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
        location: location.trim() || undefined,
        tags: selectedTags,
        status,
        attendees: [],
      });
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="event-title"
          className="block text-sm font-medium text-neutral-800"
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
          placeholder="e.g. John's 30th Birthday, Global Tech Conference"
          className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="event-description"
          className="block text-sm font-medium text-neutral-800"
        >
          Description
        </label>
        <textarea
          id="event-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief details about the event, agenda, venue details, or notes..."
          className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 resize-none"
        />
      </div>

      {/* Date & Time Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="event-date"
            className="block text-sm font-medium text-neutral-800"
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
            className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
          />
        </div>

        <div>
          <label
            htmlFor="event-time"
            className="block text-sm font-medium text-neutral-800"
          >
            Time <span className="text-red-500">*</span>
          </label>
          <input
            id="event-time"
            type="time"
            required
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              if (error) setError("");
            }}
            className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
          />
        </div>
      </div>

      {/* Location (Optional) */}
      <div>
        <label
          htmlFor="event-location"
          className="block text-sm font-medium text-neutral-800"
        >
          Location / Venue <span className="text-xs text-neutral-400">(Optional)</span>
        </label>
        <input
          id="event-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Grand Horizon Ballroom, Convention Hall, or Online"
          className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
        />
      </div>

      {/* Status selector (when editing) */}
      <div>
        <label
          htmlFor="event-status"
          className="block text-sm font-medium text-neutral-800"
        >
          Status
        </label>
        <select
          id="event-status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "Confirmed" | "Planning in Progress" | "Upcoming")
          }
          className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div className="pt-1">
        <label className="block text-sm font-medium text-neutral-800">
          Tags / Categories
        </label>
        <p className="mt-0.5 text-xs text-neutral-500">
          Select tags like Birthday, Conference, or type custom tags.
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
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-red-500 text-white shadow-xs"
                    : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                <span>{isSelected ? "✓" : "+"}</span>
                {tag}
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
            placeholder="Add custom tag (e.g. Festival)..."
            className="flex-1 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:ring-3 focus:ring-red-500/10"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-xl border border-neutral-300 bg-neutral-100 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition cursor-pointer"
          >
            Add Tag
          </button>
        </div>

        {/* Selected tags badges */}
        {selectedTags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 p-2.5">
            <span className="text-xs font-medium text-neutral-500 mr-1">
              Selected:
            </span>
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-900 focus:outline-hidden cursor-pointer"
                  title={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
        <Button variant="secondary" onClick={onClose}>
          Cancel
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
