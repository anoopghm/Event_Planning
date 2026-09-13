import { useState, useMemo } from "react";
import {
  Search,
  X,
  Plus,
  ArrowLeft,
  Filter as FilterIcon,
  ArrowUpDown,
  CalendarDays,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import StatsGrid from "./StatsGrid";
import EventCard from "../events/EventCard";
import { getEffectiveEventStatus } from "../../utils/eventUtils";
import { matchEventByLevenshtein } from "../../utils/searchUtils";
import { sortEvents } from "../../utils/sortUtils";
import type { EventItem, AuthUser, EventSortOption, PaginationMeta, StatusCounts } from "../../types";

interface DashboardOverviewProps {
  user: AuthUser;
  events: EventItem[];
  filteredEvents?: EventItem[];
  uniqueTags: string[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  selectedEventType?: string;
  onSelectEventType?: (type: string) => void;
  getTagCount: (tag: string) => number;
  onGoToMyEvents: () => void;
  onOpenCreateModal: () => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (id: string, title: string) => void;
  onConfirmAttendance: (event: EventItem) => void;
  onViewDetails: (event: EventItem) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;

  // Server-side pagination & filter extensions
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  activeTab?: "All" | "Ongoing" | "Upcoming" | "Past";
  onTabChange?: (tab: "All" | "Ongoing" | "Upcoming" | "Past") => void;
  sortBy?: EventSortOption;
  onSortChange?: (sort: EventSortOption) => void;
  counts?: StatusCounts;
  isLoading?: boolean;
}

export default function DashboardOverview({
  user,
  events,
  uniqueTags,
  selectedTag,
  onSelectTag,
  selectedEventType,
  onSelectEventType,
  getTagCount,
  onGoToMyEvents,
  onOpenCreateModal,
  onEditEvent,
  onDeleteEvent,
  onConfirmAttendance,
  onViewDetails,
  searchQuery,
  onSearchChange,
  pagination,
  onPageChange,
  activeTab: activeTabProp,
  onTabChange,
  sortBy: sortByProp,
  onSortChange,
  counts: countsProp,
  isLoading = false,
}: DashboardOverviewProps) {
  // Tabs: "All", "Upcoming", "Ongoing", "Past"
  const [localActiveTab, setLocalActiveTab] = useState<"All" | "Ongoing" | "Upcoming" | "Past">("Upcoming");
  const [searchStatusFilter, setSearchStatusFilter] = useState<"All" | "Ongoing" | "Upcoming" | "Past">("All");
  const [localSortBy, setLocalSortBy] = useState<EventSortOption>("event_time_asc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localEventType, setLocalEventType] = useState<string>("All");
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const activeTab = activeTabProp !== undefined ? activeTabProp : localActiveTab;
  const sortBy = sortByProp !== undefined ? sortByProp : localSortBy;
  const isServerPagination = Boolean(pagination);
  const currentPage = isServerPagination ? pagination!.page : localCurrentPage;

  const handleTabChange = (tab: "All" | "Ongoing" | "Upcoming" | "Past") => {
    if (onTabChange) onTabChange(tab);
    else setLocalActiveTab(tab);
    if (onPageChange) onPageChange(1);
    else setLocalCurrentPage(1);
  };

  const handleSortChange = (sort: EventSortOption) => {
    if (onSortChange) onSortChange(sort);
    else setLocalSortBy(sort);
    if (onPageChange) onPageChange(1);
    else setLocalCurrentPage(1);
  };

  const handlePageSelect = (page: number) => {
    if (onPageChange) onPageChange(page);
    else setLocalCurrentPage(page);
  };

  const activeSearch = searchQuery !== undefined ? searchQuery : localSearchQuery;
  const handleSearchChange = onSearchChange || setLocalSearchQuery;
  const effectiveEventType = selectedEventType !== undefined ? selectedEventType : localEventType;
  const handleEventTypeChange = onSelectEventType || setLocalEventType;

  const isSearching = Boolean(activeSearch.trim().length >= 3);
  const isQueryTooShort = activeSearch.trim().length > 0 && activeSearch.trim().length < 3;

  // Stats calculation
  const createdByYouCount = events.filter(
    (e) => String(e.creatorId) === String(user.id)
  ).length;

  const attendingCount = events.filter((e) =>
    e.attendees?.some(
      (a) => String(a.userId) === String(user.id) && a.status === "yes"
    )
  ).length;

  // When searching, all matching events across all statuses are found
  const allMatchingSearchEvents = useMemo(() => {
    if (!isSearching) return [];
    return events.filter((e) => {
      // 1. Tag Filter
      const matchesTag =
        selectedTag === "All" ||
        e.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

      // 2. Event Type Filter (Public vs Private)
      const matchesEventType =
        effectiveEventType === "All" ||
        (e.eventType || "Public") === effectiveEventType;

      // 3. Levenshtein Search (title, location, description, tags)
      const matchesSearch = matchEventByLevenshtein(e, activeSearch);

      return matchesTag && matchesEventType && matchesSearch;
    });
  }, [events, isSearching, activeSearch, selectedTag, effectiveEventType]);

  // Status breakdown of search results
  const searchCounts = useMemo(() => {
    if (countsProp && isSearching) {
      return {
        total: countsProp.all,
        upcoming: countsProp.upcoming,
        ongoing: countsProp.ongoing,
        past: countsProp.past
      };
    }
    let upcoming = 0;
    let ongoing = 0;
    let past = 0;
    allMatchingSearchEvents.forEach((e) => {
      const st = getEffectiveEventStatus(e);
      if (st === "Ongoing") ongoing++;
      else if (st === "Past" || (st as string) === "Finished") past++;
      else upcoming++;
    });
    return { total: allMatchingSearchEvents.length, upcoming, ongoing, past };
  }, [allMatchingSearchEvents, countsProp, isSearching]);

  // Tab counts for normal browsing
  const tabCounts = useMemo(() => {
    if (countsProp) {
      return {
        total: countsProp.all,
        upcoming: countsProp.upcoming,
        ongoing: countsProp.ongoing,
        past: countsProp.past
      };
    }
    let upcoming = 0;
    let ongoing = 0;
    let past = 0;
    events.forEach((e) => {
      const st = getEffectiveEventStatus(e);
      if (st === "Ongoing") ongoing++;
      else if (st === "Past" || (st as string) === "Finished") past++;
      else upcoming++;
    });
    return { total: events.length, upcoming, ongoing, past };
  }, [events, countsProp]);

  // Filtered events
  const tabFilteredEvents = useMemo(() => {
    if (isServerPagination) {
      return events;
    }

    if (isSearching) {
      let matched = allMatchingSearchEvents;
      if (searchStatusFilter !== "All") {
        matched = matched.filter((e) => {
          const st = getEffectiveEventStatus(e);
          if (searchStatusFilter === "Past") {
            return st === "Past" || (st as string) === "Finished";
          }
          return st === searchStatusFilter;
        });
      }
      return sortEvents(matched, sortBy, activeSearch);
    }

    // Normal browsing
    const matched = events.filter((e) => {
      const status = getEffectiveEventStatus(e);
      const matchesTab =
        activeTab === "All" ||
        (activeTab === "Past"
          ? status === "Past" || (status as string) === "Finished"
          : status === activeTab);

      const matchesTag =
        selectedTag === "All" ||
        e.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

      const matchesEventType =
        effectiveEventType === "All" ||
        (e.eventType || "Public") === effectiveEventType;

      return matchesTab && matchesTag && matchesEventType;
    });

    return sortEvents(matched, sortBy, activeSearch);
  }, [
    isServerPagination,
    events,
    isSearching,
    activeSearch,
    allMatchingSearchEvents,
    searchStatusFilter,
    activeTab,
    selectedTag,
    effectiveEventType,
    sortBy,
  ]);

  const totalItems = isServerPagination ? pagination!.totalItems : tabFilteredEvents.length;
  const totalPages = isServerPagination ? pagination!.totalPages : Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Current page slice
  const paginatedEvents = useMemo(() => {
    if (isServerPagination) return events;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tabFilteredEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [isServerPagination, events, tabFilteredEvents, currentPage, itemsPerPage]);

  const limitUsed = isServerPagination ? pagination!.limit : itemsPerPage;
  const startItemNumber = totalItems === 0 ? 0 : (currentPage - 1) * limitUsed + 1;
  const endItemNumber = Math.min(currentPage * limitUsed, totalItems);

  return (
    <div className="space-y-7">
      {/* 1. Elevated Welcome Hero Banner (Hidden during search results) */}
      {!isSearching && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-6 sm:p-8 text-white shadow-md border border-slate-800/80">
          {/* Soft background light glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 -bottom-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Welcome back, {user.name}!
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-xl">
                Organize events, confirm RSVPs, coordinate schedules, and manage all your gatherings seamlessly.
              </p>
            </div>

            {/* Right graphic box */}
            <div className="flex items-center gap-3.5 md:border-l md:border-slate-800 md:pl-7">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-rose-400 backdrop-blur-md shadow-2xs">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300">
                  Turn your ideas into
                </p>
                <p className="text-xs font-bold text-white tracking-wide">
                  unforgettable events.
                </p>
                <div className="mt-1.5 h-1 w-8 bg-gradient-to-r from-rose-500 to-indigo-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Stats Grid (Hidden during search results) */}
      {!isSearching && (
        <StatsGrid
          totalEvents={events.length}
          createdCount={createdByYouCount}
          attendingCount={attendingCount}
          tagsCount={uniqueTags.length}
          onCardClick={onGoToMyEvents}
        />
      )}

      {/* Notice when 1 or 2 letters are typed */}
      {isQueryTooShort && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs text-amber-800 animate-in fade-in shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Search className="h-3.5 w-3.5" />
            </div>
            <span>
              Type at least <strong>3 letters</strong> to search events ({activeSearch.trim().length} of 3 entered).
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* 3. Events Section */}
      <div className="space-y-4">
        {/* Section Header */}
        {isSearching ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  handleSearchChange("");
                  setSearchStatusFilter("All");
                  handleSortChange("event_time_asc");
                }}
                className="self-start inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                    Search Results
                  </h1>
                  <span className="rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                    {searchCounts.total}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Showing matches for <span className="font-semibold text-slate-800">"{activeSearch}"</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:shadow transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              <span>Create Event</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Events
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Browse all scheduled events, view details, and manage invitations.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:shadow transition cursor-pointer"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              <span>Create Event</span>
            </button>
          </div>
        )}

        {/* Search Results Panel OR Regular Tabs Bar */}
        {isSearching ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100/80">
                  <Search className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Search results for <span className="text-rose-600">"{activeSearch}"</span>
                    </h3>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Matches across Upcoming, Ongoing, and Past events.
                  </p>
                </div>
              </div>

              {/* Controls: Sort Dropdown + Clear Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Sort selector in Search Results */}
                <div className="flex-1 sm:flex-initial flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 sm:px-3 py-1.5 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 font-medium shrink-0">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      handleSortChange(e.target.value as EventSortOption);
                    }}
                    className="w-full bg-transparent text-slate-800 font-semibold outline-none cursor-pointer text-xs"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="event_time_asc">Soonest Event</option>
                    <option value="popularity">Most RSVPs</option>
                    <option value="creation_time">Newest</option>
                    <option value="event_time_desc">Furthest Event</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleSearchChange("");
                    setSearchStatusFilter("All");
                    handleSortChange("event_time_asc");
                  }}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                  <span>Clear Search</span>
                </button>
              </div>
            </div>

            {/* Quick Status Filters for Search Results: smooth horizontal touch scroll on mobile */}
            <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 overflow-x-auto no-scrollbar -mx-1 px-1 sm:flex-wrap">
              <span className="text-xs text-slate-400 font-medium shrink-0 mr-1">Status:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchStatusFilter("All");
                  handleTabChange("All");
                }}
                className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  searchStatusFilter === "All"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                All ({searchCounts.total})
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchStatusFilter("Upcoming");
                  handleTabChange("Upcoming");
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  searchStatusFilter === "Upcoming"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-indigo-50/70 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/70"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Upcoming ({searchCounts.upcoming})
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchStatusFilter("Ongoing");
                  handleTabChange("Ongoing");
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  searchStatusFilter === "Ongoing"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-50/70 text-emerald-700 border border-emerald-100 hover:bg-emerald-100/70"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ongoing ({searchCounts.ongoing})
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchStatusFilter("Past");
                  handleTabChange("Past");
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  searchStatusFilter === "Past"
                    ? "bg-slate-700 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Past ({searchCounts.past})
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
            {/* Status Tabs: All / Upcoming / Ongoing / Past */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/70 w-fit">
              {(["All", "Upcoming", "Ongoing", "Past"] as const).map((tab) => {
                const isActive = activeTab === tab;
                const count =
                  tab === "All"
                    ? tabCounts.total
                    : tab === "Upcoming"
                    ? tabCounts.upcoming
                    : tab === "Ongoing"
                    ? tabCounts.ongoing
                    : tabCounts.past;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      handleTabChange(tab);
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? "bg-slate-100 text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right side toolbar: Sort + Filter */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    handleSortChange(e.target.value as EventSortOption);
                  }}
                  className="bg-transparent text-slate-900 font-semibold outline-none cursor-pointer"
                >
                  <option value="event_time_asc">Event Time (Soonest)</option>
                  <option value="popularity">Popularity (Most RSVPs)</option>
                  <option value="creation_time">Creation Time (Newest)</option>
                  <option value="event_time_desc">Event Time (Furthest)</option>
                </select>
              </div>

              {/* Filter Button (Replaces arbitrary #1e3a34 with cohesive slate button) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs border ${
                    isFilterOpen || selectedTag !== "All" || effectiveEventType !== "All"
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <FilterIcon className="h-3.5 w-3.5" />
                  <span>Filter</span>
                  {(selectedTag !== "All" || effectiveEventType !== "All" || Boolean(activeSearch)) && (
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                  )}
                </button>

                {/* Filter Dropdown Popover */}
                {isFilterOpen && (
                  <div className="absolute right-0 top-full mt-2 z-30 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold text-slate-800">Filter Events</span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTag("All");
                          handleEventTypeChange("All");
                          handleSearchChange("");
                          handleSortChange("event_time_asc");
                          setIsFilterOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                    </div>

                    {/* Sort By inside Popover */}
                    <div className="mt-3">
                      <label className="text-[11px] font-semibold text-slate-600">Sort Events</label>
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          handleSortChange(e.target.value as EventSortOption);
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-slate-900 cursor-pointer"
                      >
                        <option value="event_time_asc">Event Time (Soonest)</option>
                        <option value="popularity">Popularity (Most RSVPs)</option>
                        <option value="creation_time">Creation Time (Newest)</option>
                        <option value="event_time_desc">Event Time (Furthest)</option>
                      </select>
                    </div>

                    {/* Event Type Filter (Public vs Private) */}
                    <div className="mt-3">
                      <label className="text-[11px] font-semibold text-slate-600">Event Type</label>
                      <div className="mt-1 flex items-center gap-1.5">
                        {(["All", "Public", "Private"] as const).map((typeOption) => {
                          const isSelected = effectiveEventType === typeOption;
                          return (
                            <button
                              key={typeOption}
                              type="button"
                              onClick={() => {
                                handleEventTypeChange(typeOption);
                                handlePageSelect(1);
                              }}
                              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                isSelected
                                  ? "bg-slate-900 text-white shadow-2xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {typeOption}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tag Filter */}
                    <div className="mt-3">
                      <label className="text-[11px] font-semibold text-slate-600">Categories & Tags</label>
                      <div className="mt-1.5 flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTag("All");
                            handlePageSelect(1);
                          }}
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                            selectedTag === "All"
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          All ({events.length})
                        </button>
                        {uniqueTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              onSelectTag(tag);
                              handlePageSelect(1);
                            }}
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                              selectedTag.toLowerCase() === tag.toLowerCase()
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            #{tag} ({getTagCount(tag)})
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="mt-4 w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer shadow-xs transition"
                    >
                      Apply Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Event Cards List */}
        <div className="space-y-3 pt-2">
          {paginatedEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-12 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <CalendarX2 className="h-7 w-7" />
              </div>
              <h3 className="mt-3.5 text-base font-bold text-slate-900">
                {isSearching
                  ? `No events matching "${activeSearch}" found`
                  : `No ${activeTab.toLowerCase()} events found`}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                {isSearching
                  ? `Try searching with different keywords or clear your search.`
                  : `There are currently no events under "${activeTab}" matching your filters.`}
              </p>
              <div className="mt-5 flex justify-center gap-2.5">
                {(selectedTag !== "All" || activeSearch || effectiveEventType !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTag("All");
                      handleEventTypeChange("All");
                      handleSearchChange("");
                      setSearchStatusFilter("All");
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-semibold shadow-xs hover:shadow cursor-pointer transition"
                >
                  + Create Event
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs animate-pulse flex items-center justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
                    <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                    <div className="h-3 bg-slate-100 rounded-md w-1/4"></div>
                  </div>
                  <div className="h-9 bg-slate-100 rounded-xl w-28"></div>
                </div>
              ))}
            </div>
          ) : (
            paginatedEvents.map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                currentUser={user}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                onConfirmAttendance={onConfirmAttendance}
                onViewDetails={onViewDetails}
                variant="row"
              />
            ))
          )}
        </div>

        {/* 4. Pagination & Stats Footer */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200/80">
            <div className="flex items-center gap-1.5">
              {/* Previous page button */}
              <button
                type="button"
                onClick={() => handlePageSelect(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageSelect(pageNum)}
                    disabled={isLoading}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next page button */}
              <button
                type="button"
                onClick={() => handlePageSelect(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Showing count indicator */}
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-800">{startItemNumber}-{endItemNumber}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalItems}</span> events
            </p>
          </div>
        )}
      </div>

      {/* 5. Footer */}
      <footer className="mt-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500">
        <p>© 2026 Evently. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <a href="#privacy" className="hover:text-slate-800 transition">
            Privacy
          </a>
          <a href="#terms" className="hover:text-slate-800 transition">
            Terms
          </a>
          <a href="#help" className="hover:text-slate-800 transition">
            Help
          </a>
        </div>
      </footer>
    </div>
  );
}
