import Button from "../ui/Button";
import type { AuthUser } from "../../types";

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  eventsCount: number;
  currentView: "dashboard" | "my-events";
  onViewChange: (view: "dashboard" | "my-events") => void;
  onOpenCreateModal: () => void;
  onSwitchUser: (user: AuthUser) => void;
  onLogout: () => void;
  availableUsers: AuthUser[];
}

export default function NavDrawer({
  isOpen,
  onClose,
  user,
  eventsCount,
  currentView,
  onViewChange,
  onOpenCreateModal,
  onSwitchUser,
  onLogout,
  availableUsers,
}: NavDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-base font-bold text-white shadow-xs">
              ✦
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-900">
              Event<span className="text-red-500">ly</span> Menu
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Profile Card */}
        <div className="border-b border-neutral-100 bg-neutral-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Signed in as
          </p>
          <p className="text-sm font-bold text-neutral-800 mt-0.5">
            {user.name}
          </p>
          <p className="text-xs text-neutral-500 truncate">
            {user.email}
          </p>

          {/* Account Switcher */}
          <div className="mt-3 pt-2 border-t border-neutral-200/60">
            <p className="text-[11px] font-medium text-neutral-500 mb-1">
              Switch Account (Local Test):
            </p>
            <div className="flex flex-col gap-1">
              {availableUsers.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => onSwitchUser(u)}
                  className={`text-left text-xs px-2 py-1.5 rounded-md transition cursor-pointer ${
                    u.id === user.id
                      ? "bg-red-500 text-white font-semibold"
                      : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {u.name} {u.id === 1 ? "• Organizer" : "• Guest"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => {
              onViewChange("dashboard");
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition cursor-pointer ${
              currentView === "dashboard"
                ? "bg-red-50 text-red-700 font-semibold"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📊</span>
              <div>
                <p className="text-sm font-medium">Dashboard</p>
                <p className="text-xs text-neutral-400">Overview & statistics</p>
              </div>
            </div>
            {currentView === "dashboard" && (
              <span className="text-xs font-bold text-red-500">•</span>
            )}
          </button>

          {/* My Events */}
          <button
            type="button"
            onClick={() => {
              onViewChange("my-events");
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition cursor-pointer ${
              currentView === "my-events"
                ? "bg-red-50 text-red-700 font-semibold"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🗓️</span>
              <div>
                <p className="text-sm font-medium">My Events</p>
                <p className="text-xs text-neutral-400">Edit, delete & RSVP</p>
              </div>
            </div>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
              {eventsCount}
            </span>
          </button>

          {/* Create Event */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreateModal();
            }}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            <span className="text-lg">➕</span>
            <div>
              <p className="text-sm font-medium">Create New Event</p>
              <p className="text-xs text-neutral-400">Add a schedule with tags</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-100 p-4">
          <Button variant="secondary" fullWidth onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
