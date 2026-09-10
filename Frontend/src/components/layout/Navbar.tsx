import Button from "../ui/Button";
import type { AuthUser } from "../../types";

interface NavbarProps {
  user: AuthUser;
  eventsCount: number;
  currentView: "dashboard" | "my-events";
  onViewChange: (view: "dashboard" | "my-events") => void;
  onOpenMenu: () => void;
  onOpenCreateModal: () => void;
  onSwitchUser: (user: AuthUser) => void;
  onLogout: () => void;
  availableUsers: AuthUser[];
}

export default function Navbar({
  user,
  eventsCount,
  currentView,
  onViewChange,
  onOpenMenu,
  onOpenCreateModal,
  onSwitchUser,
  onLogout,
  availableUsers,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-3">
          {/* Hamburger "=" Button */}
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-800 shadow-xs hover:border-red-400 hover:bg-neutral-50 transition cursor-pointer group"
            title="Open Navigation Menu (=)"
            aria-label="Toggle Navigation Menu"
          >
            <svg
              className="h-5 w-5 text-neutral-800 transition group-hover:text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
            >
              <line x1="3.5" y1="8" x2="20.5" y2="8" />
              <line x1="3.5" y1="16" x2="20.5" y2="16" />
            </svg>
          </button>

          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onViewChange("dashboard")}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-lg font-bold text-white shadow-sm">
              ✦
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900">
              Event<span className="text-red-500">ly</span>
            </span>
          </div>

          {/* View Tabs */}
          <div className="ml-4 hidden sm:flex items-center gap-1 rounded-xl bg-neutral-100 p-1 border border-neutral-200">
            <button
              type="button"
              onClick={() => onViewChange("dashboard")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                currentView === "dashboard"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onViewChange("my-events")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                currentView === "my-events"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <span>My Events</span>
              <span className="rounded-full bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-600">
                {eventsCount}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Local User Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5">
            <span className="text-[11px] text-neutral-400 font-medium">Testing as:</span>
            <select
              value={user.id}
              onChange={(e) => {
                const selected = availableUsers.find(
                  (u) => u.id === Number(e.target.value)
                );
                if (selected) onSwitchUser(selected);
              }}
              className="bg-transparent text-xs font-semibold text-neutral-800 outline-none cursor-pointer"
              title="Switch demo account"
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.id === 1 ? "(Organizer)" : "(Guest)"}
                </option>
              ))}
            </select>
          </div>

          <Button variant="primary" onClick={onOpenCreateModal}>
            + Create Event
          </Button>

          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-neutral-800">
              {user.name}
            </span>
            <span className="text-xs text-neutral-500">
              {user.email}
            </span>
          </div>

          <Button variant="secondary" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
