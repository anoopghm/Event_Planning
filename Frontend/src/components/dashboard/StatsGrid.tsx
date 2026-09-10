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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div
        onClick={onCardClick}
        className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs hover:border-neutral-300 transition cursor-pointer"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Total Events
        </span>
        <p className="mt-2 text-3xl font-bold text-neutral-900">{totalEvents}</p>
        <span className="mt-2 inline-block text-xs font-medium text-emerald-600">
          ↑ Click to manage & RSVP
        </span>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Created by You
        </span>
        <p className="mt-2 text-3xl font-bold text-neutral-900">{createdCount}</p>
        <span className="mt-2 inline-block text-xs font-medium text-neutral-500">
          You can edit & delete
        </span>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          You are Attending
        </span>
        <p className="mt-2 text-3xl font-bold text-emerald-600">{attendingCount}</p>
        <span className="mt-2 inline-block text-xs font-medium text-emerald-600">
          Confirmed YES
        </span>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Active Tags
        </span>
        <p className="mt-2 text-3xl font-bold text-red-500">{tagsCount}</p>
        <span className="mt-2 inline-block text-xs font-medium text-neutral-500">
          e.g. Birthday, Conference
        </span>
      </div>
    </div>
  );
}
