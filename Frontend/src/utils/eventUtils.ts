export type EventComputedStatus = "Upcoming" | "Ongoing" | "Finished";

export function formatTime(timeStr?: string): string {
  if (!timeStr) return "";
  try {
    const [hour, minute] = timeStr.split(":").map(Number);
    if (isNaN(hour) || isNaN(minute)) return timeStr;
    const timeDate = new Date();
    timeDate.setHours(hour, minute, 0, 0);
    return timeDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeStr;
  }
}

export function formatDateTime(
  dateStr: string,
  fromTimeStr?: string,
  toTimeStr?: string
): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dateFormatted = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (!fromTimeStr) return dateFormatted;

    const formattedFrom = formatTime(fromTimeStr);

    if (toTimeStr) {
      const formattedTo = formatTime(toTimeStr);
      return `${dateFormatted} • ${formattedFrom} – ${formattedTo}`;
    }

    return `${dateFormatted} at ${formattedFrom}`;
  } catch {
    return `${dateStr}${fromTimeStr ? ` at ${fromTimeStr}` : ""}${toTimeStr ? ` - ${toTimeStr}` : ""}`;
  }
}

/**
 * Computes event status ("Upcoming", "Ongoing", or "Finished")
 * dynamically based on current time versus the meeting's From and To timings.
 */
export function computeEventStatus(
  dateStr: string,
  fromTimeStr?: string,
  toTimeStr?: string,
  endDateStr?: string
): EventComputedStatus {
  if (!dateStr) return "Upcoming";

  const now = new Date();

  // Parse start Date & Time
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

  // Parse end Date & Time
  let endYear = year;
  let endMonth = month;
  let endDay = day;

  if (endDateStr) {
    const [ey, em, ed] = endDateStr.split("-").map(Number);
    if (!isNaN(ey)) endYear = ey;
    if (!isNaN(em)) endMonth = em;
    if (!isNaN(ed)) endDay = ed;
  }

  let endHours = 23;
  let endMinutes = 59;
  if (toTimeStr) {
    const [eh, em] = toTimeStr.split(":").map(Number);
    if (!isNaN(eh)) endHours = eh;
    if (!isNaN(em)) endMinutes = em;
  } else if (fromTimeStr) {
    // If no end time specified, default to 1 hour after start time
    endHours = Math.min(23, startHours + 1);
    endMinutes = startMinutes;
  }

  const endDateTime = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, 59, 999);

  if (now < startDateTime) {
    return "Upcoming";
  } else if (now >= startDateTime && now <= endDateTime) {
    return "Ongoing";
  } else {
    return "Finished";
  }
}

/**
 * Helper to get the real-time computed status of any event object.
 */
export function getEffectiveEventStatus(event: {
  date: string;
  time: string;
  endTime?: string;
  endDate?: string;
}): EventComputedStatus {
  return computeEventStatus(event.date, event.time, event.endTime, event.endDate);
}

export function getTagStyle(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes("birthday")) {
    return "bg-pink-50 text-pink-700 border-pink-200";
  }
  if (lower.includes("conf")) {
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  }
  if (lower.includes("work")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (lower.includes("party")) {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }
  if (lower.includes("wed")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-neutral-100 text-neutral-700 border-neutral-200";
}

export function getStatusBadge(status?: string): string {
  switch (status) {
    case "Ongoing":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "Finished":
      return "bg-neutral-100 text-neutral-600 border border-neutral-200";
    case "Upcoming":
    default:
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
  }
}
