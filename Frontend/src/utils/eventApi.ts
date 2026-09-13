import { fetchWithAuth, getAuthUser } from "./apiClient";
import { getEffectiveEventStatus } from "./eventUtils";
import { matchEventByLevenshtein } from "./searchUtils";
import { sortEvents } from "./sortUtils";
import { optimizeCloudinaryUrl } from "./cloudinary";
import type { EventItem, Attendee, PaginationMeta, StatusCounts, EventSortOption } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface FetchEventsParams {
  page?: number;
  limit?: number | "all";
  status?: string;
  tag?: string;
  search?: string;
  creator?: string;
  sort?: EventSortOption | string;
}

export interface FetchEventsResponse {
  events: EventItem[];
  pagination: PaginationMeta;
  counts: StatusCounts;
  tags: string[];
}

export function mapBackendToEventItem(evt: any): EventItem {
  let attendees: Attendee[] = [];
  if (evt.attendees) {
    if (Array.isArray(evt.attendees)) {
      attendees = evt.attendees;
    } else if (typeof evt.attendees === "object") {
      const yesList = (evt.attendees.yes || []).map((u: any) => ({
        userId: u.id || u.user_id,
        userName: u.name || "",
        userEmail: u.email || "",
        status: "yes" as const,
        updatedAt: u.updatedAt || u.updated_at
      }));
      const maybeList = (evt.attendees.maybe || []).map((u: any) => ({
        userId: u.id || u.user_id,
        userName: u.name || "",
        userEmail: u.email || "",
        status: "maybe" as const,
        updatedAt: u.updatedAt || u.updated_at
      }));
      const noList = (evt.attendees.no || []).map((u: any) => ({
        userId: u.id || u.user_id,
        userName: u.name || "",
        userEmail: u.email || "",
        status: "no" as const,
        updatedAt: u.updatedAt || u.updated_at
      }));
      attendees = [...yesList, ...maybeList, ...noList];
    }
  }

  const authUser = getAuthUser();
  if (evt.userPresence) {
    const presenceStatus = evt.userPresence as "yes" | "no" | "maybe";
    const currentUserId = authUser ? authUser.id : "currentUser";
    const existingIndex = attendees.findIndex(
      (a) =>
        (authUser && String(a.userId) === String(authUser.id)) ||
        a.userId === "currentUser" ||
        (authUser?.email && a.userEmail === authUser.email)
    );

    const currentUserAttendee: Attendee = {
      userId: currentUserId,
      userName: authUser?.name || "You",
      userEmail: authUser?.email || "",
      status: presenceStatus
    };

    if (existingIndex >= 0) {
      attendees[existingIndex] = {
        ...attendees[existingIndex],
        ...currentUserAttendee
      };
    } else {
      attendees.push(currentUserAttendee);
    }
  }

  return {
    id: String(evt.id),
    title: evt.title || "",
    description: evt.description || "",
    date: evt.date || "",
    time: evt.time || "",
    tags: Array.isArray(evt.tags) ? evt.tags : [],
    location: evt.location || "",
    imageUrl: evt.imageUrl || evt.image_url || evt.image || undefined,
    status: evt.status || "Upcoming",
    eventType: "Public",
    creatorId: evt.createdBy || evt.creator?.id,
    creatorName: evt.creator?.name || "Organizer",
    creatorEmail: evt.creator?.email || "",
    attendees,
    createdAt: evt.createdAt
  };
}

/**
 * Local fallback simulation for offline/dev resilience
 */
function getLocalFallback(params: FetchEventsParams): FetchEventsResponse {
  let allEvents: EventItem[] = [];
  try {
    const raw = localStorage.getItem("dashboard_events");
    if (raw) {
      allEvents = JSON.parse(raw);
    }
  } catch {
    allEvents = [];
  }

  // Calculate status counts
  let upcoming = 0;
  let ongoing = 0;
  let past = 0;
  const tagSet = new Set<string>();

  allEvents.forEach((e) => {
    const st = getEffectiveEventStatus(e);
    if (st === "Ongoing") ongoing++;
    else if (st === "Past" || (st as string) === "Finished") past++;
    else upcoming++;

    e.tags?.forEach((t) => tagSet.add(t));
  });

  const counts: StatusCounts = {
    all: allEvents.length,
    upcoming,
    ongoing,
    past
  };
  const tags = Array.from(tagSet);

  let filtered = allEvents;

  // Filter creator
  if (params.creator) {
    filtered = filtered.filter((e) => String(e.creatorId) === String(params.creator));
  }

  // Filter tag
  if (params.tag && params.tag !== "All") {
    filtered = filtered.filter((e) =>
      e.tags?.some((t) => t.toLowerCase() === params.tag?.toLowerCase())
    );
  }

  // Filter status
  if (params.status && params.status !== "All") {
    filtered = filtered.filter((e) => {
      const st = getEffectiveEventStatus(e);
      if (params.status === "Past") {
        return st === "Past" || (st as string) === "Finished";
      }
      return st === params.status;
    });
  }

  // Filter search
  if (params.search && params.search.trim().length >= 3) {
    filtered = filtered.filter((e) => matchEventByLevenshtein(e, params.search!));
  }

  // Sort
  const sortBy = (params.sort || "event_time_asc") as EventSortOption;
  filtered = sortEvents(filtered, sortBy, params.search);

  // Pagination
  const totalItems = filtered.length;
  const isAll = params.limit === "all";
  const limitNum = typeof params.limit === "number" ? params.limit : 4;
  const pageNum = params.page || 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / (isAll ? (totalItems || 1) : limitNum)));
  const offset = (pageNum - 1) * limitNum;
  const paginated = isAll ? filtered : filtered.slice(offset, offset + limitNum);

  return {
    events: paginated,
    pagination: {
      page: pageNum,
      limit: isAll ? totalItems : limitNum,
      totalItems,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    },
    counts,
    tags
  };
}

/**
 * Fetches paginated & filtered events from server (with seamless offline fallback)
 */
export async function fetchEventsApi(params: FetchEventsParams): Promise<FetchEventsResponse> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.status && params.status !== "All") query.set("status", params.status);
  if (params.tag && params.tag !== "All") query.set("tag", params.tag);
  if (params.search && params.search.trim()) query.set("search", params.search.trim());
  if (params.creator) query.set("creator", params.creator);
  if (params.sort) query.set("sort", params.sort);

  try {
    const url = `${API_BASE}/api/events${query.toString() ? `?${query.toString()}` : ""}`;
    const response = await fetchWithAuth(url);

    if (response.ok) {
      const data = await response.json();

      const events: EventItem[] = (data.events || []).map(mapBackendToEventItem);
      const pagination: PaginationMeta = data.pagination || {
        page: params.page || 1,
        limit: typeof params.limit === "number" ? params.limit : 4,
        totalItems: data.total || events.length,
        totalPages: Math.max(1, Math.ceil((data.total || events.length) / (typeof params.limit === "number" ? params.limit : 4))),
        hasNextPage: false,
        hasPrevPage: false
      };

      const counts: StatusCounts = data.counts || {
        all: data.total || events.length,
        upcoming: 0,
        ongoing: 0,
        past: 0
      };

      const tags: string[] = data.tags || [];

      return { events, pagination, counts, tags };
    }
  } catch {
    // Backend unreachable
  }

  // Fallback to local storage if API call fails
  return getLocalFallback(params);
}

/**
 * Creates a new event on the server (with local storage sync)
 */
export async function createEventApi(eventData: Omit<EventItem, "id">): Promise<EventItem> {
  const optimizedImageUrl = eventData.imageUrl ? optimizeCloudinaryUrl(eventData.imageUrl) : undefined;
  const payload = {
    title: eventData.title,
    description: eventData.description,
    date: eventData.date,
    time: eventData.time,
    location: eventData.location,
    imageUrl: optimizedImageUrl,
    tags: eventData.tags,
    status: eventData.status || "Upcoming"
  };

  try {
    const response = await fetchWithAuth(`${API_BASE}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      const created = mapBackendToEventItem(data.event);
      // Also sync to local storage
      syncLocalEvent(created);
      return created;
    }
  } catch {
    // Backend unreachable
  }

  // Fallback create
  const fallbackEvent: EventItem = {
    ...eventData,
    imageUrl: optimizedImageUrl || eventData.imageUrl,
    id: `evt-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  syncLocalEvent(fallbackEvent);
  return fallbackEvent;
}

/**
 * Updates an existing event on the server (with local storage sync)
 */
export async function updateEventApi(id: string | number, eventData: Partial<EventItem>): Promise<EventItem> {
  const payload: Record<string, unknown> = {};
  if (eventData.title !== undefined) payload.title = eventData.title;
  if (eventData.description !== undefined) payload.description = eventData.description;
  if (eventData.date !== undefined) payload.date = eventData.date;
  if (eventData.time !== undefined) payload.time = eventData.time;
  if (eventData.location !== undefined) payload.location = eventData.location;
  if (eventData.imageUrl !== undefined) {
    payload.imageUrl = eventData.imageUrl ? optimizeCloudinaryUrl(eventData.imageUrl) : "";
  }
  if (eventData.tags !== undefined) payload.tags = eventData.tags;
  if (eventData.status !== undefined) payload.status = eventData.status;

  try {
    const response = await fetchWithAuth(`${API_BASE}/api/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      const updated = mapBackendToEventItem(data.event);
      updateLocalEvent(updated);
      return updated;
    }
  } catch {
    // Backend unreachable
  }

  const updatedFallback: EventItem = {
    ...(eventData as EventItem),
    imageUrl: eventData.imageUrl !== undefined ? (optimizeCloudinaryUrl(eventData.imageUrl) || undefined) : undefined,
    id: String(id)
  };
  updateLocalEvent(updatedFallback);
  return updatedFallback;
}

/**
 * Deletes an event on the server (with local storage sync)
 */
export async function deleteEventApi(id: string | number): Promise<void> {
  try {
    await fetchWithAuth(`${API_BASE}/api/events/${id}`, {
      method: "DELETE"
    });
  } catch {
    // Backend unreachable
  }

  deleteLocalEvent(String(id));
}

/**
 * Helper to update attendee presence in localStorage
 */
export function markLocalPresence(
  eventId: string | number,
  status: "yes" | "no" | "maybe",
  user?: { id: number | string; name: string; email: string } | null
) {
  try {
    const raw = localStorage.getItem("dashboard_events");
    const list: EventItem[] = raw ? JSON.parse(raw) : [];
    const authUser = user || getAuthUser() || { id: 1, name: "You", email: "" };

    const updated = list.map((e) => {
      if (String(e.id) !== String(eventId)) return e;

      const currentAttendees = [...(e.attendees || [])];
      const index = currentAttendees.findIndex(
        (a) =>
          String(a.userId) === String(authUser.id) ||
          a.userId === "currentUser" ||
          (authUser.email && a.userEmail === authUser.email)
      );

      const updatedAttendee: Attendee = {
        userId: authUser.id,
        userName: authUser.name || "You",
        userEmail: authUser.email || "",
        status,
        updatedAt: new Date().toISOString()
      };

      if (index >= 0) {
        currentAttendees[index] = { ...currentAttendees[index], ...updatedAttendee };
      } else {
        currentAttendees.push(updatedAttendee);
      }

      return {
        ...e,
        attendees: currentAttendees
      };
    });

    localStorage.setItem("dashboard_events", JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Marks presence (RSVP: 'yes', 'no', or 'maybe') for an event on the server,
 * and synchronizes with localStorage for offline resilience.
 */
export async function markPresenceApi(
  id: string | number,
  status: "yes" | "no" | "maybe",
  user?: { id: number | string; name: string; email: string } | null
): Promise<any> {
  // Always update local storage first so offline/fallback resilience is guaranteed
  markLocalPresence(id, status, user);

  try {
    const response = await fetchWithAuth(`${API_BASE}/api/events/${id}/presence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Backend unreachable - fallback is already updated
  }
}

// Helpers for localStorage sync
function syncLocalEvent(evt: EventItem) {
  try {
    const raw = localStorage.getItem("dashboard_events");
    const list: EventItem[] = raw ? JSON.parse(raw) : [];
    list.unshift(evt);
    localStorage.setItem("dashboard_events", JSON.stringify(list));
  } catch {
    // ignore
  }
}

function updateLocalEvent(evt: EventItem) {
  try {
    const raw = localStorage.getItem("dashboard_events");
    const list: EventItem[] = raw ? JSON.parse(raw) : [];
    const updated = list.map((e) => (String(e.id) === String(evt.id) ? { ...e, ...evt } : e));
    localStorage.setItem("dashboard_events", JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function deleteLocalEvent(id: string) {
  try {
    const raw = localStorage.getItem("dashboard_events");
    const list: EventItem[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((e) => String(e.id) !== id);
    localStorage.setItem("dashboard_events", JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

