import type { EventItem, EventSortOption } from "../types";
import { getEventLevenshteinScore } from "./searchUtils";

/**
 * Returns epoch timestamp for an event's schedule date and time.
 */
export function getEventTimeTimestamp(event: EventItem): number {
  if (!event.date) return 0;
  try {
    const [year, month, day] = event.date.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return 0;

    let hour = 0;
    let minute = 0;
    if (event.time) {
      const [h, m] = event.time.split(":").map(Number);
      if (!isNaN(h)) hour = h;
      if (!isNaN(m)) minute = m;
    }

    return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
  } catch {
    return 0;
  }
}

/**
 * Calculates popularity score:
 * Heavily weights confirmed "yes" attendees, followed by total RSVP responses.
 */
export function getEventPopularityScore(event: EventItem): number {
  if (!event.attendees || !Array.isArray(event.attendees)) return 0;
  const yesCount = event.attendees.filter((a) => a.status === "yes").length;
  const maybeCount = event.attendees.filter((a) => a.status === "maybe").length;
  const totalCount = event.attendees.length;

  return yesCount * 1000 + maybeCount * 100 + totalCount;
}

/**
 * Gets attendee count breakdown for displaying popularity badges.
 */
export function getEventAttendeeCounts(event: EventItem): {
  yes: number;
  maybe: number;
  no: number;
  total: number;
} {
  if (!event.attendees || !Array.isArray(event.attendees)) {
    return { yes: 0, maybe: 0, no: 0, total: 0 };
  }
  const yes = event.attendees.filter((a) => a.status === "yes").length;
  const maybe = event.attendees.filter((a) => a.status === "maybe").length;
  const no = event.attendees.filter((a) => a.status === "no").length;
  return { yes, maybe, no, total: event.attendees.length };
}

/**
 * Returns epoch timestamp when the event was created.
 * Uses event.createdAt or extracts timestamp from evt-<timestamp> ID.
 */
export function getEventCreationTimestamp(event: EventItem): number {
  if (event.createdAt) {
    const parsed = new Date(event.createdAt).getTime();
    if (!isNaN(parsed)) return parsed;
  }

  // Fallback: extract from id e.g. "evt-1726000000000"
  if (event.id) {
    const match = event.id.match(/^evt-(\d{10,13})$/);
    if (match && match[1]) {
      const timestamp = Number(match[1]);
      if (!isNaN(timestamp)) return timestamp;
    }
  }

  return 0;
}

/**
 * Sorts an array of events based on the specified sort option.
 */
export function sortEvents(
  events: EventItem[],
  sortOption: EventSortOption,
  searchQuery?: string
): EventItem[] {
  const items = [...events];

  switch (sortOption) {
    case "popularity":
      return items.sort((a, b) => {
        const scoreDiff = getEventPopularityScore(b) - getEventPopularityScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        // Secondary tie-breaker: soonest event time
        return getEventTimeTimestamp(a) - getEventTimeTimestamp(b);
      });

    case "creation_time":
      return items.sort((a, b) => {
        const createdDiff = getEventCreationTimestamp(b) - getEventCreationTimestamp(a);
        if (createdDiff !== 0) return createdDiff;
        return getEventTimeTimestamp(a) - getEventTimeTimestamp(b);
      });

    case "event_time_desc":
      return items.sort((a, b) => {
        const timeDiff = getEventTimeTimestamp(b) - getEventTimeTimestamp(a);
        if (timeDiff !== 0) return timeDiff;
        return getEventPopularityScore(b) - getEventPopularityScore(a);
      });

    case "relevance":
      if (searchQuery && searchQuery.trim().length >= 3) {
        return items.sort((a, b) => {
          const scoreDiff =
            getEventLevenshteinScore(b, searchQuery) -
            getEventLevenshteinScore(a, searchQuery);
          if (scoreDiff !== 0) return scoreDiff;
          return getEventTimeTimestamp(a) - getEventTimeTimestamp(b);
        });
      }
      return items.sort(
        (a, b) => getEventTimeTimestamp(a) - getEventTimeTimestamp(b)
      );

    case "event_time_asc":
    default:
      return items.sort((a, b) => {
        const timeDiff = getEventTimeTimestamp(a) - getEventTimeTimestamp(b);
        if (timeDiff !== 0) return timeDiff;
        return getEventPopularityScore(b) - getEventPopularityScore(a);
      });
  }
}
