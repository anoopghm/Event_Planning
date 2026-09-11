import { useEffect } from "react";
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
  onLogout: () => void;
}

export default function NavDrawer({
  isOpen,
  onClose,
  user,
  eventsCount,
  currentView,
  onViewChange,
  onOpenCreateModal,
  onLogout,
}: NavDrawerProps) {
  // Prevent body scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-base font-bold text-white shadow-xs">
              ✦
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900">
              Event<span className="text-red-500">ly</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition cursor-pointer"
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        {/* Profile Card */}
        <div className="border-b border-neutral-100 bg-neutral-50/70 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Signed in as
              </p>
              <p className="text-sm font-bold text-neutral-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => {
              onViewChange("dashboard");
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded-xl p-3.5 text-left transition cursor-pointer active:scale-[0.98] ${
              currentView === "dashboard"
                ? "bg-red-50 text-red-700 font-semibold border border-red-200/60"
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
            className={`flex w-full items-center justify-between rounded-xl p-3.5 text-left transition cursor-pointer active:scale-[0.98] ${
              currentView === "my-events"
                ? "bg-red-50 text-red-700 font-semibold border border-red-200/60"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🗓️</span>
              <div>
                <p className="text-sm font-medium">My Events</p>
                <p className="text-xs text-neutral-400">Events created by you</p>
              </div>
            </div>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
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
            className="flex w-full items-center gap-3 rounded-xl p-3.5 text-left text-neutral-700 hover:bg-neutral-100 transition cursor-pointer active:scale-[0.98]"
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
