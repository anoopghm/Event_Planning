export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface Attendee {
  userId: number | string;
  userName: string;
  userEmail: string;
  status: "yes" | "no";
  acknowledgedTime?: string;
  updatedAt?: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  tags: string[];
  location?: string;
  status?: "Confirmed" | "Planning in Progress" | "Upcoming";
  creatorId?: number | string;
  creatorName?: string;
  creatorEmail?: string;
  attendees?: Attendee[];
  lastTimeUpdated?: string;
}
