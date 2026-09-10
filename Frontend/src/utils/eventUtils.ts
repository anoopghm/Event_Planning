export function formatDateTime(dateStr: string, timeStr?: string): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dateFormatted = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (!timeStr) return dateFormatted;

    const [hour, minute] = timeStr.split(":").map(Number);
    const timeDate = new Date();
    timeDate.setHours(hour, minute);
    const timeFormatted = timeDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${dateFormatted} at ${timeFormatted}`;
  } catch {
    return `${dateStr}${timeStr ? ` at ${timeStr}` : ""}`;
  }
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
    case "Confirmed":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "Planning in Progress":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    default:
      return "bg-blue-50 text-blue-700 border border-blue-200";
  }
}
