import { NextFunction, Request, Response } from "express";
import pool from "../models/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { AuthenticatedRequest } from "../middleware/auth";
import { filterEventsByLevenshtein } from "../utils/searchUtils";

export interface EventRow extends RowDataPacket {
  id: number;
  title: string;
  description: string | null;
  date: string;
  time: string;
  location: string | null;
  tags: unknown;
  status: string;
  created_by: number;
  created_at: Date | string;
  updated_at: Date | string;
  creator_name?: string;
  creator_email?: string;
  yes_count?: number;
  no_count?: number;
  user_presence?: "yes" | "no" | null;
}

interface PresenceAttendeeRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  status: "yes" | "no";
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
  const tags = normalizeTags(req.body.tags);
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Authentication is required" });
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO events (title, description, date, time, location, tags, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description ? description.trim() : "",
        date.trim(),
        time.trim(),
        location ? location.trim() : null,
        JSON.stringify(tags),
        status ? status.trim() : "Upcoming",
        userId
      ]
    );

    const eventId = result.insertId;

    // Fetch the newly created event with creator details
    const [rows] = await pool.execute<EventRow[]>(
      `SELECT e.*, u.name AS creator_name, u.email AS creator_email
       FROM events e
       JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [eventId]
    );

    const createdEvent = formatEvent(rows[0], userId);

    return res.status(201).json({
      ok: true,
      message: "Event created successfully",
      event: createdEvent
    });
  } catch (err) {
    console.error("Create event error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/events
 * Fetch all events (supports tag filtering, search, and user presence)
 */
export async function getEvents(req: AuthenticatedRequest, res: Response, next?: NextFunction) {
  const currentUserId = req.user?.id;
  const { tag, search, status, creator, sort, sortBy, order } = req.query;

  try {
    let query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.time,
        e.location,
        e.tags,
        e.status,
        e.created_by,
        e.created_at,
        e.updated_at,
        u.name AS creator_name,
        u.email AS creator_email,
        COALESCE(SUM(CASE WHEN p.status = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count,
        COALESCE(SUM(CASE WHEN p.status = 'no' THEN 1 ELSE 0 END), 0) AS no_count
        ${currentUserId ? `, MAX(CASE WHEN p.user_id = ${Number(currentUserId)} THEN p.status ELSE NULL END) AS user_presence` : ""}
      FROM events e
      JOIN users u ON e.created_by = u.id
      LEFT JOIN event_presence p ON e.id = p.event_id
    `;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (!search && status && typeof status === "string") {
      whereConditions.push("e.status = ?");
      params.push(status.trim());
    }

    if (creator) {
      if (creator === "me" && currentUserId) {
        whereConditions.push("e.created_by = ?");
        params.push(currentUserId);
      } else if (!isNaN(Number(creator))) {
        whereConditions.push("e.created_by = ?");
        params.push(Number(creator));
      }
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    const effectiveSort = (sort || sortBy || "event_time").toString().toLowerCase().trim();
    const effectiveOrder = (order || "asc").toString().toLowerCase().trim() === "desc" ? "DESC" : "ASC";

    let orderByClause = "ORDER BY e.date ASC, e.time ASC";
    if (effectiveSort === "popularity") {
      orderByClause = "ORDER BY yes_count DESC, no_count DESC, e.date ASC";
    } else if (effectiveSort === "creation_time" || effectiveSort === "created_at") {
      orderByClause = `ORDER BY e.created_at ${effectiveOrder === "ASC" ? "ASC" : "DESC"}`;
    } else if (effectiveSort === "event_time" || effectiveSort === "time") {
      orderByClause = `ORDER BY e.date ${effectiveOrder}, e.time ${effectiveOrder}`;
    }

    query += `
      GROUP BY e.id, u.id
      ${orderByClause}
    `;

    const [rows] = await pool.execute<EventRow[]>(query, params);

    let events = rows.map((row) => formatEvent(row, currentUserId));

    // If filtering by tag (tags are JSON array)
    if (tag && typeof tag === "string") {
      const targetTag = tag.trim().toLowerCase();
      events = events.filter((evt) =>
        evt.tags.some((t) => t.toLowerCase() === targetTag)
      );
    }

    // Levenshtein fuzzy search across title, location, description, and tags
    // Searches across all Upcoming, Ongoing, and Past events
    if (search && typeof search === "string" && search.trim() !== "") {
      events = filterEventsByLevenshtein(events, search.trim());

      // If user specified sort option while searching
      if (effectiveSort === "popularity") {
        events.sort((a, b) => b.rsvpSummary.yes - a.rsvpSummary.yes);
      } else if (effectiveSort === "creation_time" || effectiveSort === "created_at") {
        events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (effectiveSort === "event_time" || effectiveSort === "time") {
        events.sort((a, b) => {
          const diff = new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime();
          return effectiveOrder === "DESC" ? -diff : diff;
        });
      }

      // If status filter was also explicitly requested along with search
      if (status && typeof status === "string" && status.trim() !== "" && status.toLowerCase() !== "all") {
        const targetStatus = status.trim().toLowerCase();
        events = events.filter((evt) => {
          const s = evt.status.toLowerCase();
          if (targetStatus === "past" || targetStatus === "finished") {
            return s === "past" || s === "finished";
          }
          return s === targetStatus;
        });
      }
    }

    return res.json({
      ok: true,
      count: events.length,
      events
    });
  } catch (err) {
    console.error("Get events error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
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
    return res.status(400).json({ message: "Invalid event ID" });
  }

  try {
    const [rows] = await pool.execute<EventRow[]>(
      `SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.time,
        e.location,
        e.tags,
        e.status,
        e.created_by,
        e.created_at,
        e.updated_at,
        u.name AS creator_name,
        u.email AS creator_email,
        COALESCE(SUM(CASE WHEN p.status = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count,
        COALESCE(SUM(CASE WHEN p.status = 'no' THEN 1 ELSE 0 END), 0) AS no_count
        ${currentUserId ? `, MAX(CASE WHEN p.user_id = ${Number(currentUserId)} THEN p.status ELSE NULL END) AS user_presence` : ""}
      FROM events e
      JOIN users u ON e.created_by = u.id
      LEFT JOIN event_presence p ON e.id = p.event_id
      WHERE e.id = ?
      GROUP BY e.id, u.id`,
      [eventId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Fetch list of attendees who marked presence
    const [attendeeRows] = await pool.execute<PresenceAttendeeRow[]>(
      `SELECT p.user_id, u.name, u.email, p.status, p.updated_at
       FROM event_presence p
       JOIN users u ON p.user_id = u.id
       WHERE p.event_id = ?
       ORDER BY p.updated_at DESC`,
      [eventId]
    );

    const attendees = {
      yes: attendeeRows
        .filter((a) => a.status === "yes")
        .map((a) => ({ id: a.user_id, name: a.name, email: a.email, updatedAt: a.updated_at })),
      no: attendeeRows
        .filter((a) => a.status === "no")
        .map((a) => ({ id: a.user_id, name: a.name, email: a.email, updatedAt: a.updated_at }))
    };

    const formatted = formatEvent(rows[0], currentUserId);

    return res.json({
      ok: true,
      event: {
        ...formatted,
        attendees
      }
    });
  } catch (err) {
    console.error("Get event by ID error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
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
    return res.status(400).json({ message: "Invalid event ID" });
  }

  if (!currentUserId) {
    return res.status(401).json({ message: "Authentication is required" });
  }

  try {
    // 1. Fetch the event to verify existence and check creator ownership
    const [existingRows] = await pool.execute<EventRow[]>(
      "SELECT id, created_by, title, description, date, time, location, tags, status FROM events WHERE id = ?",
      [eventId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = existingRows[0];

    // 2. Authorization check: ONLY creator can modify
    if (event.created_by !== currentUserId) {
      return res.status(403).json({
        message: "You are not authorized to modify this event. Only the event creator can modify it."
      });
    }

    // 3. Prepare updated fields (allow partial or full updates)
    const { title, description, date, time, location, status } = req.body;

    const newTitle = title !== undefined ? String(title).trim() : event.title;
    const newDescription = description !== undefined ? String(description).trim() : (event.description || "");
    const newDate = date !== undefined ? String(date).trim() : event.date;
    const newTime = time !== undefined ? String(time).trim() : event.time;
    const newLocation = location !== undefined ? (location ? String(location).trim() : null) : event.location;
    const newStatus = status !== undefined ? String(status).trim() : event.status;
    const newTags = req.body.tags !== undefined ? normalizeTags(req.body.tags) : parseTags(event.tags);

    await pool.execute(
      `UPDATE events
       SET title = ?, description = ?, date = ?, time = ?, location = ?, tags = ?, status = ?
       WHERE id = ?`,
      [
        newTitle,
        newDescription,
        newDate,
        newTime,
        newLocation,
        JSON.stringify(newTags),
        newStatus,
        eventId
      ]
    );

    // Fetch updated event
    const [updatedRows] = await pool.execute<EventRow[]>(
      `SELECT e.*, u.name AS creator_name, u.email AS creator_email,
         COALESCE(SUM(CASE WHEN p.status = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count,
         COALESCE(SUM(CASE WHEN p.status = 'no' THEN 1 ELSE 0 END), 0) AS no_count,
         MAX(CASE WHEN p.user_id = ? THEN p.status ELSE NULL END) AS user_presence
       FROM events e
       JOIN users u ON e.created_by = u.id
       LEFT JOIN event_presence p ON e.id = p.event_id
       WHERE e.id = ?
       GROUP BY e.id, u.id`,
      [currentUserId, eventId]
    );

    return res.json({
      ok: true,
      message: "Event updated successfully",
      event: formatEvent(updatedRows[0], currentUserId)
    });
  } catch (err) {
    console.error("Update event error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
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
    return res.status(400).json({ message: "Invalid event ID" });
  }

  if (!currentUserId) {
    return res.status(401).json({ message: "Authentication is required" });
  }

  try {
    // 1. Fetch the event to verify existence and check creator ownership
    const [existingRows] = await pool.execute<EventRow[]>(
      "SELECT id, created_by, title FROM events WHERE id = ?",
      [eventId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = existingRows[0];

    // 2. Authorization check: ONLY creator can delete
    if (event.created_by !== currentUserId) {
      return res.status(403).json({
        message: "You are not authorized to delete this event. Only the event creator can delete it."
      });
    }

    // 3. Delete the event (cascades to event_presence table)
    await pool.execute("DELETE FROM events WHERE id = ?", [eventId]);

    return res.json({
      ok: true,
      message: `Event "${event.title}" deleted successfully`,
      deletedEventId: eventId
    });
  } catch (err) {
    console.error("Delete event error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
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
    return res.status(400).json({ message: "Invalid event ID" });
  }

  if (!currentUserId) {
    return res.status(401).json({ message: "Authentication is required" });
  }

  const rawStatus = (req.body.status || req.body.presence || "").toString().toLowerCase().trim();

  if (rawStatus !== "yes" && rawStatus !== "no") {
    return res.status(400).json({
      message: "Presence status must be either 'yes' or 'no'"
    });
  }

  try {
    // Check if event exists
    const [eventRows] = await pool.execute<EventRow[]>(
      "SELECT id, title FROM events WHERE id = ?",
      [eventId]
    );

    if (eventRows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Upsert presence record
    await pool.execute(
      `INSERT INTO event_presence (event_id, user_id, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
      [eventId, currentUserId, rawStatus]
    );

    // Get updated RSVP summary
    const [summaryRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
         COALESCE(SUM(CASE WHEN status = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count,
         COALESCE(SUM(CASE WHEN status = 'no' THEN 1 ELSE 0 END), 0) AS no_count
       FROM event_presence
       WHERE event_id = ?`,
      [eventId]
    );

    const yesCount = Number(summaryRows[0]?.yes_count || 0);
    const noCount = Number(summaryRows[0]?.no_count || 0);

    return res.json({
      ok: true,
      message: `Presence marked as '${rawStatus}' successfully`,
      eventId,
      presence: rawStatus,
      rsvpSummary: {
        yes: yesCount,
        no: noCount
      }
    });
  } catch (err) {
    console.error("Mark presence error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/events/:id/presence (or /api/events/:id/rsvp)
 * View attendee presence breakdown
 */
export async function getPresence(req: Request, res: Response, next?: NextFunction) {
  const eventId = Number(req.params.id);

  if (isNaN(eventId)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  try {
    const [eventRows] = await pool.execute<EventRow[]>(
      "SELECT id, title FROM events WHERE id = ?",
      [eventId]
    );

    if (eventRows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const [attendeeRows] = await pool.execute<PresenceAttendeeRow[]>(
      `SELECT p.user_id, u.name, u.email, p.status, p.updated_at
       FROM event_presence p
       JOIN users u ON p.user_id = u.id
       WHERE p.event_id = ?
       ORDER BY p.updated_at DESC`,
      [eventId]
    );

    const yesAttendees = attendeeRows
      .filter((a) => a.status === "yes")
      .map((a) => ({ id: a.user_id, name: a.name, email: a.email, updatedAt: a.updated_at }));

    const noAttendees = attendeeRows
      .filter((a) => a.status === "no")
      .map((a) => ({ id: a.user_id, name: a.name, email: a.email, updatedAt: a.updated_at }));

    return res.json({
      ok: true,
      eventId,
      eventTitle: eventRows[0].title,
      rsvpSummary: {
        yes: yesAttendees.length,
        no: noAttendees.length
      },
      attendees: {
        yes: yesAttendees,
        no: noAttendees
      }
    });
  } catch (err) {
    console.error("Get presence error:", err);
    if (next) return next(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
