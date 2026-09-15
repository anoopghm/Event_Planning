import { NextFunction, Request, Response } from "express";
import db from "../models/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { filterEventsByLevenshtein } from "../utils/searchUtils";
import { logger } from "../utils/logger";
import { optimizeCloudinaryUrl } from "../utils/cloudinary";

export interface EventRow {
  id: number;
  title: string;
  description: string | null;
  date: string;
  time: string;
  location: string | null;
  image_url?: string | null;
  tags: unknown;
  status: string;
  created_by: number;
  created_at: Date | string;
  updated_at: Date | string;
  creator_name?: string;
  creator_email?: string;
  yes_count?: number;
  no_count?: number;
  maybe_count?: number;
  user_presence?: "yes" | "no" | "maybe" | null;
}

interface PresenceAttendeeRow {
  event_id?: number;
  user_id: number;
  name: string;
  email: string;
  status: "yes" | "no" | "maybe";
  updated_at: Date | string;
}

export function normalizeTags(rawTags: unknown): string[] {
  if (!rawTags) return [];
  if (Array.isArray(rawTags)) {
    return rawTags
      .map((t) => (typeof t === "string" ? t.trim() : String(t).trim()))
      .filter(Boolean);
  }
  if (typeof rawTags === "string") {
    try {
      const parsed = JSON.parse(rawTags);
      if (Array.isArray(parsed)) {
        return parsed
          .map((t) => (typeof t === "string" ? t.trim() : String(t).trim()))
          .filter(Boolean);
      }
    } catch {
      // not JSON string, treat as comma-separated
    }
    return rawTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export function parseTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

/**
 * Dynamically computes real-time event status ("Upcoming", "Ongoing", or "Past")
 */
export function computeEventStatus(
  dateStr: string,
  fromTimeStr?: string,
  toTimeStr?: string
): "Upcoming" | "Ongoing" | "Past" {
  if (!dateStr) return "Upcoming";
  const now = new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return "Upcoming";

  let startHours = 0;
  let startMinutes = 0;
  if (fromTimeStr) {
    const [h, m] = fromTimeStr.split(":").map(Number);
    if (!isNaN(h)) startHours = h;
    if (!isNaN(m)) startMinutes = m;
  }
  const startDateTime = new Date(year, month - 1, day, startHours, startMinutes, 0, 0);

  let endHours = 23;
  let endMinutes = 59;
  if (toTimeStr) {
    const [eh, em] = toTimeStr.split(":").map(Number);
    if (!isNaN(eh)) endHours = eh;
    if (!isNaN(em)) endMinutes = em;
  } else if (fromTimeStr) {
    endHours = Math.min(23, startHours + 1);
    endMinutes = startMinutes;
  }
  const endDateTime = new Date(year, month - 1, day, endHours, endMinutes, 59, 999);

  if (now < startDateTime) {
    return "Upcoming";
  } else if (now >= startDateTime && now <= endDateTime) {
    return "Ongoing";
  } else {
    return "Past";
  }
}

/**
 * Helper to format event database row into clean JSON response
 */
function formatEvent(row: EventRow, currentUserId?: number) {
  const dynamicStatus = computeEventStatus(row.date, row.time);

  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    date: row.date,
    time: row.time,
    location: row.location || "",
    imageUrl: row.image_url || null,
    tags: parseTags(row.tags),
    status: dynamicStatus,
    createdBy: row.created_by,
    creator: {
      id: row.created_by,
      name: row.creator_name || "Unknown",
      email: row.creator_email || ""
    },
    isCreator: currentUserId !== undefined ? row.created_by === currentUserId : false,
    rsvpSummary: {
      yes: Number(row.yes_count || 0),
      maybe: Number(row.maybe_count || 0),
      no: Number(row.no_count || 0)
    },
    userPresence: row.user_presence || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * POST /api/events
 * Create a new event
 */
export async function createEvent(req: AuthenticatedRequest, res: Response, next?: NextFunction) {
  const { title, description, date, time, location, status } = req.body;
  const rawImage = req.body.imageUrl || req.body.image_url || null;
  const imageUrl = optimizeCloudinaryUrl(rawImage);
  const tags = normalizeTags(req.body.tags);
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      code: "AUTH_REQUIRED",
      message: "You must be signed in to create an event."
    });
  }

  try {
    const [eventId] = await db("events").insert({
      title: title.trim(),
      description: description ? description.trim() : "",
      date: date.trim(),
      time: time.trim(),
      location: location ? location.trim() : null,
      image_url: imageUrl,
      tags: JSON.stringify(tags),
      status: status ? status.trim() : "Upcoming",
      created_by: userId
    });

    // Fetch the newly created event with creator details
    const row = await db("events as e")
      .join("users as u", "e.created_by", "u.id")
      .select("e.*", "u.name as creator_name", "u.email as creator_email")
      .where("e.id", eventId)
      .first<EventRow>();

    const createdEvent = formatEvent(row!, userId);

    logger.info(`Event created successfully [eventId: ${eventId}, title: "${title.trim()}", creatorId: ${userId}]`);

    return res.status(201).json({
      ok: true,
      message: "Event created successfully",
      event: createdEvent
    });
  } catch (err) {
    logger.error("Create event error:", err);
    if (next) return next(err);
    return res.status(500).json({
      ok: false,
      code: "CREATE_EVENT_FAILED",
      message: "We were unable to create your event. Please try again."
    });
  }
}

/**
 * GET /api/events
 * Fetch all events (supports tag filtering, search, and user presence)
 */
export async function getEvents(req: AuthenticatedRequest, res: Response, next?: NextFunction) {
  const currentUserId = req.user?.id;
  const { tag, search, status, creator, sort, sortBy, order, page, limit } = req.query;

  try {
    const query = db("events as e")
      .join("users as u", "e.created_by", "u.id")
      .leftJoin("event_presence as p", "e.id", "p.event_id")
      .select(
        "e.id",
        "e.title",
        "e.description",
        "e.date",
        "e.time",
        "e.location",
        "e.image_url",
        "e.tags",
        "e.status",
        "e.created_by",
        "e.created_at",
        "e.updated_at",
        "u.name as creator_name",
        "u.email as creator_email",
        db.raw("COALESCE(SUM(CASE WHEN p.status = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count"),
        db.raw("COALESCE(SUM(CASE WHEN p.status = 'no' THEN 1 ELSE 0 END), 0) AS no_count"),
        db.raw("COALESCE(SUM(CASE WHEN p.status = 'maybe' THEN 1 ELSE 0 END), 0) AS maybe_count")
      );

    if (currentUserId) {
      query.select(
        db.raw("MAX(CASE WHEN p.user_id = ? THEN p.status ELSE NULL END) AS user_presence", [Number(currentUserId)])
      );
    }

    if (creator) {
      if (creator === "me" && currentUserId) {
        query.where("e.created_by", currentUserId);
      } else if (!isNaN(Number(creator))) {
        query.where("e.created_by", Number(creator));
      }
    }

    query.groupBy("e.id", "u.id").orderBy([
      { column: "e.date", order: "asc" },
      { column: "e.time", order: "asc" }
    ]);

    const rows = (await query) as EventRow[];

    // Map rows into formatted events with dynamic real-time status
    const allFormattedEvents = rows.map((row) => formatEvent(row, currentUserId));

    // Fetch attendee records for all returned events to populate the attendees list
    if (allFormattedEvents.length > 0) {
      const eventIds = allFormattedEvents.map((e) => e.id);
      const attendeeRows = (await db("event_presence as p")
        .join("users as u", "p.user_id", "u.id")
        .select("p.event_id", "p.user_id", "u.name", "u.email", "p.status", "p.updated_at")
        .whereIn("p.event_id", eventIds)
        .orderBy("p.updated_at", "desc")) as PresenceAttendeeRow[];

      const attendeesByEvent = new Map<number, { yes: any[]; maybe: any[]; no: any[] }>();
      for (const att of attendeeRows) {
        const eid = Number(att.event_id);
        if (!attendeesByEvent.has(eid)) {
          attendeesByEvent.set(eid, { yes: [], maybe: [], no: [] });
        }
        const group = attendeesByEvent.get(eid)!;
        const attendeeObj = {
          id: att.user_id,
          name: att.name,
          email: att.email,
          updatedAt: att.updated_at
        };
        if (att.status === "yes") group.yes.push(attendeeObj);
        else if (att.status === "maybe") group.maybe.push(attendeeObj);
        else if (att.status === "no") group.no.push(attendeeObj);
      }

      allFormattedEvents.forEach((evt) => {
        (evt as any).attendees = attendeesByEvent.get(Number(evt.id)) || { yes: [], maybe: [], no: [] };
      });
    }

    // Calculate status breakdown counts across all events (or creator events)
    let upcomingCount = 0;
    let ongoingCount = 0;
    let pastCount = 0;
    const tagSet = new Set<string>();

    allFormattedEvents.forEach((evt) => {
      if (evt.status === "Ongoing") ongoingCount++;
      else if (evt.status === "Past" || (evt.status as string) === "Finished") pastCount++;
      else upcomingCount++;

      if (Array.isArray(evt.tags)) {
        evt.tags.forEach((t) => {
          if (t && typeof t === "string" && t.trim()) {
            tagSet.add(t.trim());
          }
        });
      }
    });

    const statusCounts = {
      all: allFormattedEvents.length,
      upcoming: upcomingCount,
      ongoing: ongoingCount,
      past: pastCount
    };
    const availableTags = Array.from(tagSet);

    let filteredEvents = allFormattedEvents;

    // 1. Filter by Tag (if specified and not "All")
    if (tag && typeof tag === "string" && tag.trim() !== "" && tag.trim().toLowerCase() !== "all") {
      const targetTag = tag.trim().toLowerCase();
      filteredEvents = filteredEvents.filter((evt) =>
        evt.tags.some((t) => t.toLowerCase() === targetTag)
      );
    }

    // 2. Filter by Status (uses dynamic real-time status)
    if (status && typeof status === "string" && status.trim() !== "" && status.trim().toLowerCase() !== "all") {
      const targetStatus = status.trim().toLowerCase();
      filteredEvents = filteredEvents.filter((evt) => {
        const s = evt.status.toLowerCase();
        if (targetStatus === "past" || targetStatus === "finished") {
          return s === "past" || s === "finished";
        }
        return s === targetStatus;
      });
    }

    // 3. Filter by Search Query (Levenshtein fuzzy matching)
    const isSearching = Boolean(search && typeof search === "string" && search.trim().length > 0);
    if (isSearching) {
      filteredEvents = filterEventsByLevenshtein(filteredEvents, (search as string).trim());
    }

    // 4. Sorting
    const sortParam = (sort || sortBy || "").toString().toLowerCase().trim();
    const orderParam = (order || "asc").toString().toLowerCase().trim() === "desc" ? "DESC" : "ASC";

    if (sortParam === "popularity") {
      filteredEvents.sort((a, b) => b.rsvpSummary.yes - a.rsvpSummary.yes);
    } else if (sortParam === "creation_time" || sortParam === "created_at") {
      filteredEvents.sort((a, b) => {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return orderParam === "DESC" ? diff : -diff;
      });
    } else if (sortParam === "event_time_desc") {
      filteredEvents.sort((a, b) => {
        const diff = new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime();
        return -diff;
      });
    } else if (sortParam === "event_time_asc") {
      filteredEvents.sort((a, b) => {
        const diff = new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime();
        return diff;
      });
    } else if (!isSearching) {
      // Default chronological ordering when not searching
      filteredEvents.sort((a, b) => {
        const diff = new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime();
        return orderParam === "DESC" ? -diff : diff;
      });
    }

    // 5. Server-Side Pagination
    const totalItems = filteredEvents.length;
    const isAllLimit = limit === "all" || limit === "0";

    const pageNumber = Math.max(1, parseInt(String(page || 1), 10) || 1);
    const pageSize = isAllLimit
      ? totalItems
      : Math.max(1, Math.min(100, parseInt(String(limit || 4), 10) || 4));

    const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)));
    const offset = (pageNumber - 1) * pageSize;
    const paginatedEvents = isAllLimit
      ? filteredEvents
      : filteredEvents.slice(offset, offset + pageSize);

    logger.info(
      `Events queried [page: ${pageNumber}/${totalPages}, limit: ${pageSize}, returned: ${paginatedEvents.length}, total: ${totalItems}, filters: { status: ${status || "All"}, tag: ${tag || "All"}, search: ${search || "-"} }]`
    );

    return res.json({
      ok: true,
      events: paginatedEvents,
      count: paginatedEvents.length,
      total: totalItems,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        totalItems,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      },
      counts: statusCounts,
      tags: availableTags
    });
  } catch (err) {
    logger.error("Get events error:", err);
    if (next) return next(err);
    return res.status(500).json({
      ok: false,
      code: "FETCH_EVENTS_FAILED",
      message: "We were unable to load events at this time. Please try refreshing."
    });
  }
}

/**
 * GET /api/events/:id
 * Fetch single event details, including attendees and RSVP stats
 */
export async function getEventById(req: AuthenticatedRequest, res: Response, next?: NextFunction) {
  const eventId = Number(req.params.id);
  const currentUserId = req.user?.id;

  if (isNaN(eventId)) {
    logger.warn(`Get event failed: invalid event ID parameter [param: "${req.params.id}"]`);
    return res.status(400).json({
      ok: false,
      code: "INVALID_EVENT_ID",
      message: "The event ID is invalid. It must be a valid number."
    });
  }

  try {
    const query = db("events as e")
      .join("users as u", "e.created_by", "u.id")
      .leftJoin("event_presence as p", "e.id", "p.event_id")
      .select(
        "e.id",
        "e.title",
        "e.description",
        "e.date",
        "e.time",
        "e.location",
        "e.image_url",
        "e.tags",
        "e.status",
        "e.created_by",
        "e.created_at",
        "e.updated_at",
        "u.name as creator_name",
        "u.email as creator_email",
        db.raw("COALESCE(SUM(CASE WHEN p.status = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count"),
        db.raw("COALESCE(SUM(CASE WHEN p.status = 'no' THEN 1 ELSE 0 END), 0) AS no_count"),
        db.raw("COALESCE(SUM(CASE WHEN p.status = 'maybe' THEN 1 ELSE 0 END), 0) AS maybe_count")
      )
      .where("e.id", eventId);

    if (currentUserId) {
      query.select(
        db.raw("MAX(CASE WHEN p.user_id = ? THEN p.status ELSE NULL END) AS user_presence", [Number(currentUserId)])
      );
    }

    query.groupBy("e.id", "u.id");

    const row = await query.first<EventRow>();

    if (!row) {
      logger.warn(`Get event failed: event not found [eventId: ${eventId}]`);
      return res.status(404).json({
        ok: false,
        code: "EVENT_NOT_FOUND",
        message: "The requested event could not be found. It may have been deleted."
      });
    }

    // Fetch list of attendees who marked presence
    const attendeeRows = (await db("event_presence as p")
      .join("users as u", "p.user_id", "u.id")
      .select("p.user_id", "u.name", "u.email", "p.status", "p.updated_at")
      .where("p.event_id", eventId)
      .orderBy("p.updated_at", "desc")) as PresenceAttendeeRow[];

    const attendees = {
      yes: attendeeRows
        .filter((a) => a.status === "yes")
        .map((a) => ({ id: a.user_id, name: a.name, email: a.email, updatedAt: a.updated_at })),
      maybe: attendeeRows
        .filter((a) => a.status === "maybe")
        .map((a) => ({ id: a.user_id, name: a.name, email: a.email, updatedAt: a.updated_at })),
      no: attendeeRows
        .filter((a) => a.status === "no")
        .map((a) => ({ id: a.user_id, name: a.name, email: a.email, updatedAt: a.updated_at }))
    };

    const formatted = formatEvent(row, currentUserId);

    logger.info(`Event details retrieved [eventId: ${eventId}, title: "${row.title}"]`);

    return res.json({
      ok: true,
      event: {
        ...formatted,
        attendees
      }
    });
  } catch (err) {
    logger.error(`Get event by ID error [eventId: ${eventId}]:`, err);
    if (next) return next(err);
    return res.status(500).json({
      ok: false,
      code: "FETCH_EVENT_FAILED",
      message: "Unable to retrieve event details at this time. Please try again."
    });
  }
}

/**
 * PUT /api/events/:id or PATCH /api/events/:id
 * Modify an event (creator only)
 */
export async function updateEvent(req: AuthenticatedRequest, res: Response, next?: NextFunction) {
  const eventId = Number(req.params.id);
  const currentUserId = req.user?.id;

  if (isNaN(eventId)) {
    return res.status(400).json({
      ok: false,
      code: "INVALID_EVENT_ID",
      message: "The event ID is invalid. It must be a valid number."
    });
  }

  if (!currentUserId) {
    return res.status(401).json({
      ok: false,
      code: "AUTH_REQUIRED",
      message: "You must be signed in to modify an event."
    });
  }

  try {
    // 1. Fetch the event to verify existence and check creator ownership
    const event = await db<EventRow>("events")
      .select("id", "created_by", "title", "description", "date", "time", "location", "image_url", "tags", "status")
      .where({ id: eventId })
      .first();

    if (!event) {
      logger.warn(`Update event failed: event not found [eventId: ${eventId}]`);
      return res.status(404).json({
        ok: false,
        code: "EVENT_NOT_FOUND",
        message: "The event you are trying to update could not be found."
      });
    }

    // 2. Authorization check: ONLY creator can modify
    if (event.created_by !== currentUserId) {
      logger.warn(`Update event forbidden: user ${currentUserId} is not creator of event ${eventId} (owner: ${event.created_by})`);
      return res.status(403).json({
        ok: false,
        code: "FORBIDDEN",
        message: "You do not have permission to modify this event. Only the creator can update it."
      });
    }

    // 3. Prepare updated fields (allow partial or full updates)
    const { title, description, date, time, location, status } = req.body;
    const rawImage = req.body.imageUrl !== undefined ? req.body.imageUrl : req.body.image_url;

    const newTitle = title !== undefined ? String(title).trim() : event.title;
    const newDescription = description !== undefined ? String(description).trim() : (event.description || "");
    const newDate = date !== undefined ? String(date).trim() : event.date;
    const newTime = time !== undefined ? String(time).trim() : event.time;
    const newLocation = location !== undefined ? (location ? String(location).trim() : null) : event.location;
    const newImageUrl = rawImage !== undefined ? optimizeCloudinaryUrl(rawImage) : (event.image_url || null);
    const newStatus = status !== undefined ? String(status).trim() : event.status;
    const newTags = req.body.tags !== undefined ? normalizeTags(req.body.tags) : parseTags(event.tags);

    await db("events")
      .where({ id: eventId })
      .update({
        title: newTitle,
        description: newDescription,
        date: newDate,
        time: newTime,
        location: newLocation,
        image_url: newImageUrl ?? null,
        tags: JSON.stringify(newTags),
        status: newStatus
      });

    // Fetch updated event
    const updatedRow = await db("events as e")
      .join("users as u", "e.created_by", "u.id")
      .leftJoin("event_presence as p", "e.id", "p.event_id")
      .select(
        "e.*",
        "u.name as creator_name",
        "u.email as creator_email",
        db.raw("COALESCE(SUM(CASE WHEN p.status = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count"),
        db.raw("COALESCE(SUM(CASE WHEN p.status = 'no' THEN 1 ELSE 0 END), 0) AS no_count"),
        db.raw("COALESCE(SUM(CASE WHEN p.status = 'maybe' THEN 1 ELSE 0 END), 0) AS maybe_count"),
        db.raw("MAX(CASE WHEN p.user_id = ? THEN p.status ELSE NULL END) AS user_presence", [currentUserId])
      )
      .where("e.id", eventId)
      .groupBy("e.id", "u.id")
      .first<EventRow>();

    logger.info(`Event updated successfully [eventId: ${eventId}, updatedBy: ${currentUserId}]`);

    return res.json({
      ok: true,
      message: "Event updated successfully",
      event: formatEvent(updatedRow!, currentUserId)
    });
  } catch (err) {
    logger.error(`Update event error [eventId: ${eventId}]:`, err);
    if (next) return next(err);
    return res.status(500).json({
      ok: false,
      code: "UPDATE_EVENT_FAILED",
      message: "Unable to update the event at this time. Please try again."
    });
  }
}

/**
 * DELETE /api/events/:id
 * Delete an event (creator only)
 */
export async function deleteEvent(req: AuthenticatedRequest, res: Response, next?: NextFunction) {
  const eventId = Number(req.params.id);
  const currentUserId = req.user?.id;

  if (isNaN(eventId)) {
    logger.warn(`Delete event failed: invalid event ID parameter [param: "${req.params.id}"]`);
    return res.status(400).json({
      ok: false,
      code: "INVALID_EVENT_ID",
      message: "The event ID is invalid. It must be a valid number."
    });
  }

  if (!currentUserId) {
    return res.status(401).json({
      ok: false,
      code: "AUTH_REQUIRED",
      message: "You must be signed in to delete an event."
    });
  }

  try {
    // 1. Fetch the event to verify existence and check creator ownership
    const event = await db<EventRow>("events")
      .select("id", "created_by", "title")
      .where({ id: eventId })
      .first();

    if (!event) {
      logger.warn(`Delete event failed: event not found [eventId: ${eventId}]`);
      return res.status(404).json({
        ok: false,
        code: "EVENT_NOT_FOUND",
        message: "The event you are trying to delete could not be found."
      });
    }

    // 2. Authorization check: ONLY creator can delete
    if (event.created_by !== currentUserId) {
      logger.warn(`Delete event forbidden: user ${currentUserId} is not creator of event ${eventId} (owner: ${event.created_by})`);
      return res.status(403).json({
        ok: false,
        code: "FORBIDDEN",
        message: "You do not have permission to delete this event. Only the creator can delete it."
      });
    }

    // 3. Delete the event (cascades to event_presence table)
    await db("events").where({ id: eventId }).del();

    logger.info(`Event deleted successfully [eventId: ${eventId}, title: "${event.title}", deletedBy: ${currentUserId}]`);

    return res.json({
      ok: true,
      message: `Event "${event.title}" deleted successfully`,
      deletedEventId: eventId
    });
  } catch (err) {
    logger.error(`Delete event error [eventId: ${eventId}]:`, err);
    if (next) return next(err);
    return res.status(500).json({
      ok: false,
      code: "DELETE_EVENT_FAILED",
      message: "Unable to delete the event at this time. Please try again."
    });
  }
}

/**
 * POST /api/events/:id/presence (or /api/events/:id/rsvp)
 * Mark presence: yes or no
 */
export async function markPresence(req: AuthenticatedRequest, res: Response, next?: NextFunction) {
  const eventId = Number(req.params.id);
  const currentUserId = req.user?.id;

  if (isNaN(eventId)) {
    logger.warn(`Mark presence failed: invalid event ID [param: "${req.params.id}"]`);
    return res.status(400).json({
      ok: false,
      code: "INVALID_EVENT_ID",
      message: "The event ID is invalid. It must be a valid number."
    });
  }

  if (!currentUserId) {
    return res.status(401).json({
      ok: false,
      code: "AUTH_REQUIRED",
      message: "You must be signed in to submit an RSVP."
    });
  }

  const rawStatus = (req.body.status || req.body.presence || "").toString().toLowerCase().trim();

  if (rawStatus !== "yes" && rawStatus !== "no" && rawStatus !== "maybe") {
    logger.warn(`Mark presence rejected: invalid status "${rawStatus}" [eventId: ${eventId}, userId: ${currentUserId}]`);
    return res.status(400).json({
      ok: false,
      code: "INVALID_STATUS",
      message: "Attendance response must be either 'yes', 'no', or 'maybe'."
    });
  }

  try {
    // Check if event exists
    const event = await db<EventRow>("events")
      .select("id", "title")
      .where({ id: eventId })
      .first();

    if (!event) {
      logger.warn(`Mark presence failed: event not found [eventId: ${eventId}]`);
      return res.status(404).json({
        ok: false,
        code: "EVENT_NOT_FOUND",
        message: "The event you are attempting to RSVP to could not be found."
      });
    }

    // Upsert presence record
    await db.raw(
      `INSERT INTO event_presence (event_id, user_id, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
      [eventId, currentUserId, rawStatus]
    );

    // Get updated RSVP summary
    const summaryRow: any = await db("event_presence")
      .where({ event_id: eventId })
      .select(
        db.raw("COALESCE(SUM(CASE WHEN status = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count"),
        db.raw("COALESCE(SUM(CASE WHEN status = 'no' THEN 1 ELSE 0 END), 0) AS no_count"),
        db.raw("COALESCE(SUM(CASE WHEN status = 'maybe' THEN 1 ELSE 0 END), 0) AS maybe_count")
      )
      .first();

    const yesCount = Number(summaryRow?.yes_count || 0);
    const noCount = Number(summaryRow?.no_count || 0);
    const maybeCount = Number(summaryRow?.maybe_count || 0);

    logger.info(`Presence marked [eventId: ${eventId}, userId: ${currentUserId}, status: "${rawStatus}", totals: { yes: ${yesCount}, maybe: ${maybeCount}, no: ${noCount} }]`);

    return res.json({
      ok: true,
      message: `Presence marked as '${rawStatus}' successfully`,
      eventId,
      presence: rawStatus,
      rsvpSummary: {
        yes: yesCount,
        maybe: maybeCount,
        no: noCount
      }
    });
  } catch (err) {
    logger.error(`Mark presence error [eventId: ${eventId}, userId: ${currentUserId}]:`, err);
    if (next) return next(err);
    return res.status(500).json({
      ok: false,
      code: "MARK_PRESENCE_FAILED",
      message: "Unable to record your attendance at this time. Please try again."
    });
  }
}

/**
 * GET /api/events/:id/presence (or /api/events/:id/rsvp)
 * View attendee presence breakdown
 */
export async function getPresence(req: Request, res: Response, next?: NextFunction) {
  const eventId = Number(req.params.id);

  if (isNaN(eventId)) {
    logger.warn(`Get presence failed: invalid event ID [param: "${req.params.id}"]`);
    return res.status(400).json({
      ok: false,
      code: "INVALID_EVENT_ID",
      message: "The event ID is invalid. It must be a valid number."
    });
  }

  try {
    const event = await db<EventRow>("events")
      .select("id", "title")
      .where({ id: eventId })
      .first();

    if (!event) {
      logger.warn(`Get presence failed: event not found [eventId: ${eventId}]`);
      return res.status(404).json({
        ok: false,
        code: "EVENT_NOT_FOUND",
        message: "The requested event could not be found."
      });
    }

    const attendeeRows = (await db("event_presence as p")
      .join("users as u", "p.user_id", "u.id")
      .select("p.user_id", "u.name", "u.email", "p.status", "p.updated_at")
      .where("p.event_id", eventId)
      .orderBy("p.updated_at", "desc")) as PresenceAttendeeRow[];

    const yesAttendees = attendeeRows
      .filter((a) => a.status === "yes")
      .map((a) => ({ id: a.user_id, name: a.name, email: a.email, updatedAt: a.updated_at }));

    const maybeAttendees = attendeeRows
      .filter((a) => a.status === "maybe")
      .map((a) => ({ id: a.user_id, name: a.name, email: a.email, updatedAt: a.updated_at }));

    const noAttendees = attendeeRows
      .filter((a) => a.status === "no")
      .map((a) => ({ id: a.user_id, name: a.name, email: a.email, updatedAt: a.updated_at }));

    logger.info(`Presence retrieved [eventId: ${eventId}, yes: ${yesAttendees.length}, maybe: ${maybeAttendees.length}, no: ${noAttendees.length}]`);

    return res.json({
      ok: true,
      eventId,
      eventTitle: event.title,
      rsvpSummary: {
        yes: yesAttendees.length,
        maybe: maybeAttendees.length,
        no: noAttendees.length
      },
      attendees: {
        yes: yesAttendees,
        maybe: maybeAttendees,
        no: noAttendees
      }
    });
  } catch (err) {
    logger.error(`Get presence error [eventId: ${eventId}]:`, err);
    if (next) return next(err);
    return res.status(500).json({
      ok: false,
      code: "FETCH_PRESENCE_FAILED",
      message: "Unable to retrieve attendance details at this time. Please try again."
    });
  }
}
