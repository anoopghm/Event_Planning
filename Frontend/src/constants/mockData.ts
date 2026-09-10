import type { AuthUser, EventItem } from "../types";

export const DEMO_USERS: AuthUser[] = [
  { id: 1, name: "Alex Morgan", email: "alex.morgan@evently.com" },
  { id: 2, name: "Jordan Lee", email: "jordan.lee@company.com" },
  { id: 3, name: "Taylor Swift", email: "taylor.s@musiccorp.com" },
];

export const PRESET_TAGS = [
  "Birthday",
  "Conference",
  "Workshop",
  "Wedding",
  "Party",
  "Networking",
  "Meeting",
  "Seminar",
];

export const STATUS_OPTIONS: Array<"Confirmed" | "Planning in Progress" | "Upcoming"> = [
  "Upcoming",
  "Confirmed",
  "Planning in Progress",
];

export const DEFAULT_EVENTS: EventItem[] = [
  {
    id: "evt-1",
    title: "Tech Innovators Annual Gala 2026",
    description: "Annual gala and keynote celebrating breakthrough startups and technology leadership.",
    date: "2026-10-24",
    time: "18:00",
    tags: ["Conference", "Corporate"],
    location: "Grand Horizon Ballroom",
    status: "Confirmed",
    creatorId: 1,
    creatorName: "Alex Morgan",
    creatorEmail: "alex.morgan@evently.com",
    attendees: [
      {
        userId: 2,
        userName: "Jordan Lee",
        userEmail: "jordan.lee@company.com",
        status: "yes",
        acknowledgedTime: "2026-10-24 18:00",
        updatedAt: "2026-09-10T10:00:00Z",
      },
      {
        userId: 3,
        userName: "Taylor Swift",
        userEmail: "taylor.s@musiccorp.com",
        status: "no",
        acknowledgedTime: "2026-10-24 18:00",
        updatedAt: "2026-09-10T10:15:00Z",
      },
    ],
  },
  {
    id: "evt-2",
    title: "Sarah's 30th Birthday Celebration",
    description: "Dinner, rooftop cocktails, and celebration with friends and family.",
    date: "2026-09-28",
    time: "19:00",
    tags: ["Birthday", "Party"],
    location: "Skyline Lounge & Rooftop",
    status: "Upcoming",
    creatorId: 2,
    creatorName: "Jordan Lee",
    creatorEmail: "jordan.lee@company.com",
    attendees: [
      {
        userId: 3,
        userName: "Taylor Swift",
        userEmail: "taylor.s@musiccorp.com",
        status: "yes",
        acknowledgedTime: "2026-09-28 19:00",
        updatedAt: "2026-09-10T11:00:00Z",
      },
    ],
  },
  {
    id: "evt-3",
    title: "Autumn Product Launch & Keynote",
    description: "Showcasing next-generation developer platforms, hardware, and keynote addresses.",
    date: "2026-11-12",
    time: "10:30",
    tags: ["Conference"],
    location: "Convention Center Hall B",
    status: "Planning in Progress",
    creatorId: 1,
    creatorName: "Alex Morgan",
    creatorEmail: "alex.morgan@evently.com",
    attendees: [],
  },
  {
    id: "evt-4",
    title: "Alex's Milestone Birthday Gathering",
    description: "Weekend garden barbecue celebration with live music and catering.",
    date: "2026-10-05",
    time: "15:00",
    tags: ["Birthday"],
    location: "Pine Crest Gardens",
    status: "Confirmed",
    creatorId: 3,
    creatorName: "Taylor Swift",
    creatorEmail: "taylor.s@musiccorp.com",
    attendees: [
      {
        userId: 1,
        userName: "Alex Morgan",
        userEmail: "alex.morgan@evently.com",
        status: "yes",
        acknowledgedTime: "2026-10-05 15:00",
        updatedAt: "2026-09-10T12:00:00Z",
      },
    ],
  },
];
