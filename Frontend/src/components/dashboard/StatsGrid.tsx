import {
  CalendarDays,
  UserCheck,
  CheckCircle2,
  Tag,
  ArrowUpRight,
} from "lucide-react";

interface StatsGridProps {
  totalEvents: number;
  createdCount: number;
  attendingCount: number;
  tagsCount: number;
  onCardClick?: () => void;
}

export default function StatsGrid({
  totalEvents,
  createdCount,
  attendingCount,
  tagsCount,
  onCardClick,
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Events */}
      <div
        onClick={onCardClick}
        className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md cursor-pointer"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Events
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {totalEvents}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 font-medium">
            <span className="text-indigo-600 font-semibold">Manage & RSVP</span>
          </div>
        </div>
      </div>

      {/* Card 2: Created by You */}
      <div className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100/80 transition-colors group-hover:bg-rose-600 group-hover:text-white">
          <UserCheck className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Created by You
          </span>
          <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {createdCount}
          </p>
          <span className="mt-1 block text-xs text-slate-500 font-medium">
            You can edit & delete
          </span>
        </div>
      </div>

      {/* Card 3: You are Attending */}
      <div className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            You are Attending
          </span>
          <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {attendingCount}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Confirmed YES
          </span>
        </div>
      </div>

      {/* Card 4: Active Tags */}
      <div className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 transition-colors group-hover:bg-amber-600 group-hover:text-white">
          <Tag className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Tags
          </span>
          <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {tagsCount}
          </p>
          <span className="mt-1 block text-xs text-slate-500 font-medium truncate">
            Categorized events
          </span>
        </div>
      </div>
    </div>
  );
}
