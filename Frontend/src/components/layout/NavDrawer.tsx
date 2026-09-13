import { useEffect } from "react";
import { Sparkles, X, LayoutDashboard, Calendar, Plus, LogOut } from "lucide-react";
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
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-sm shadow-rose-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Event<span className="text-rose-600">ly</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold text-sm ring-2 ring-white">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Signed in as
              </p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user.email}
              </p>
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
            className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition cursor-pointer active:scale-[0.98] ${
              currentView === "dashboard"
                ? "bg-rose-50 text-rose-800 font-semibold border border-rose-200/70"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                currentView === "dashboard" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
              }`}>
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Dashboard</p>
                <p className="text-xs text-slate-400">Overview & statistics</p>
              </div>
            </div>
            {currentView === "dashboard" && (
              <span className="h-2 w-2 rounded-full bg-rose-600" />
            )}
          </button>

          {/* My Events */}
          <button
            type="button"
            onClick={() => {
              onViewChange("my-events");
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition cursor-pointer active:scale-[0.98] ${
              currentView === "my-events"
                ? "bg-rose-50 text-rose-800 font-semibold border border-rose-200/70"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                currentView === "my-events" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
              }`}>
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">My Events</p>
                <p className="text-xs text-slate-400">Events created by you</p>
              </div>
            </div>
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
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
            className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Create New Event</p>
              <p className="text-xs text-slate-400">Add a schedule with tags</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4">
          <Button variant="secondary" fullWidth onClick={onLogout} className="flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4 text-slate-500" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
