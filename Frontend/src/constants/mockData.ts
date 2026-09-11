import type { EventItem } from "../types";

export const PRESET_TAGS = [
  "Birthday",
  "Conference",
  "Workshop",
  "Wedding",
  "Party",
  "Networking",
  "Meeting",
  "Seminar",
  "Tech",
];

export const STATUS_OPTIONS: Array<"Upcoming" | "Ongoing" | "Past"> = [
  "Upcoming",
  "Ongoing",
  "Past",
];

export const EVENT_TYPE_OPTIONS: Array<"Public" | "Private"> = [
  "Public",
  "Private",
];

export const DEFAULT_EVENTS: EventItem[] = [];
