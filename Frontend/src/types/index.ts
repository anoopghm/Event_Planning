export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface Attendee {
  userId: number | string;
  userName: string;
  userEmail: string;
  status: "yes" | "no" | "maybe";
  acknowledgedTime?: string;
  updatedAt?: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string; // From time (Start time)
  endTime?: string; // To time (End time)
  endDate?: string; // Optional end date for multi-day events
  tags: string[];
  location?: string;
  status?: "Upcoming" | "Ongoing" | "Past" | "Finished";
  eventType?: "Public" | "Private";
  creatorId?: number | string;
  creatorName?: string;
  creatorEmail?: string;
  attendees?: Attendee[];
  imageUrl?: string;
  lastTimeUpdated?: string;
  createdAt?: string;
}

export type EventSortOption =
  | "event_time_asc"
  | "event_time_desc"
  | "popularity"
  | "creation_time"
  | "relevance";

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface StatusCounts {
  all: number;
  upcoming: number;
  ongoing: number;
  past: number;
}

