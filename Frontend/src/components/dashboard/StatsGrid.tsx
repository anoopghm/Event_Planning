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
        className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition hover:border-neutral-300 hover:shadow-sm cursor-pointer"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <span className="text-xs font-medium text-neutral-500">
            Total Events
          </span>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-neutral-900">
            {totalEvents}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            <span className="font-bold text-red-500">↑</span>
            <span>Click to manage & RSVP</span>
          </div>
        </div>
      </div>

      {/* Card 2: Created by You */}
      <div className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition hover:border-neutral-300 hover:shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <span className="text-xs font-medium text-neutral-500">
            Created by You
          </span>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-neutral-900">
            {createdCount}
          </p>
          <span className="mt-1 block text-xs text-neutral-500">
            You can edit & delete
          </span>
        </div>
      </div>

      {/* Card 3: You are Attending */}
      <div className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition hover:border-neutral-300 hover:shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <span className="text-xs font-medium text-neutral-500">
            You are Attending
          </span>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-neutral-900">
            {attendingCount}
          </p>
          <span className="mt-1 block text-xs font-semibold text-emerald-600">
            Confirmed YES
          </span>
        </div>
      </div>

      {/* Card 4: Active Tags */}
      <div className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition hover:border-neutral-300 hover:shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <div className="flex-1">
          <span className="text-xs font-medium text-neutral-500">
            Active Tags
          </span>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-neutral-900">
            {tagsCount}
          </p>
          <span className="mt-1 block text-xs text-neutral-500 truncate">
            e.g. Birthday, Conference
          </span>
        </div>
      </div>
    </div>
  );
}
