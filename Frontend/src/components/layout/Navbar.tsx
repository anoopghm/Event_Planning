import { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  Plus,
  Calendar,
  Menu,
  ChevronDown,
  LogOut,
  Sparkles,
} from "lucide-react";
import type { AuthUser } from "../../types";

interface NavbarProps {
  user: AuthUser;
  eventsCount: number;
  currentView: "dashboard" | "my-events";
  onViewChange: (view: "dashboard" | "my-events") => void;
  onOpenMenu: () => void;
  onOpenCreateModal: () => void;
  onLogout: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function Navbar({
  user,
  eventsCount,
  currentView,
  onViewChange,
  onOpenMenu,
  onOpenCreateModal,
  onLogout,
  searchQuery = "",
  onSearchChange = () => {},
}: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 gap-2 sm:gap-4">
        {/* Left Section: Mobile Menu Toggle + Logo + Navigation Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Drawer Toggle Button ("=") */}
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex md:hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
            title="Open Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <button
            type="button"
            onClick={() => onViewChange("dashboard")}
            className="group flex shrink-0 items-center gap-2.5 cursor-pointer select-none focus:outline-none"
            title="Evently - Return to Dashboard"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xs transition group-hover:scale-105 group-hover:from-rose-600 group-hover:to-rose-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline text-lg sm:text-xl font-bold tracking-tight text-slate-900 transition group-hover:text-rose-600">
              Evently
            </span>
          </button>

          {/* Desktop Navigation Buttons */}
          <div className="hidden md:flex items-center gap-2 lg:gap-2.5">
            {/* My Events Button */}
            <button
              type="button"
              onClick={() => onViewChange("my-events")}
              className={`flex items-center gap-2 rounded-xl px-4 lg:px-4.5 py-2 text-xs lg:text-sm font-semibold transition cursor-pointer shrink-0 border ${
                currentView === "my-events"
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-2xs"
              }`}
              title="View My Events"
            >
              <Calendar className="h-4 w-4 shrink-0" />
              <span>My Events</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold transition ${
                  currentView === "my-events"
                    ? "bg-white/20 text-white"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {eventsCount}
              </span>
            </button>

            {/* Create Button */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white px-4 lg:px-4.5 py-2 text-xs lg:text-sm font-semibold shadow-xs hover:shadow transition cursor-pointer shrink-0"
              title="Create a new event"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Center Section: Desktop Clean Search Bar (hidden on mobile, moved to full-width below) */}
        <div className="hidden md:flex flex-1 min-w-0 max-w-sm md:max-w-md lg:max-w-xl mx-2 lg:mx-4">
          <div className="relative w-full flex items-center">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search events (min. 3 characters)..."
              className="w-full h-10 sm:h-10.5 rounded-xl border border-slate-200 bg-slate-100/70 py-2 pl-10 pr-20 sm:pr-24 text-xs sm:text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10 shadow-2xs"
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 gap-1.5">
                {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                  <span className="pointer-events-none text-[10px] font-semibold text-amber-700 bg-amber-100/80 rounded-md px-1.5 py-0.5">
                    {3 - searchQuery.trim().length} more
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition rounded-lg hover:bg-slate-200/60"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Mobile Quick Create + User Profile Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Quick Create Icon Button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition cursor-pointer"
            title="Create new event"
            aria-label="Create new event"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>

          {/* User Profile & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 sm:gap-2.5 rounded-xl border border-slate-200 bg-white p-1.5 sm:px-3 sm:py-1.5 text-left transition hover:border-slate-300 hover:bg-slate-50 cursor-pointer focus:outline-none shadow-2xs"
              aria-expanded={isDropdownOpen}
              aria-label="User profile menu"
            >
              {/* Avatar Circle */}
              <div className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 text-white text-xs font-bold shadow-2xs">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              {/* User Name & Email (desktop only) */}
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-500 font-normal truncate max-w-[130px]">
                  {user.email}
                </span>
              </div>

              {/* Chevron Icon */}
              <ChevronDown
                className={`hidden sm:block h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180 text-slate-700" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Header profile info */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Sign out */}
                <div className="mt-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Mobile Search Bar (full-width row, comfortable typing & touch targets) */}
      <div className="md:hidden border-t border-slate-100 bg-white/60 px-3.5 sm:px-6 py-2.5">
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events (min. 3 characters)..."
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-100/80 py-2 pl-10 pr-24 text-xs sm:text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10 shadow-2xs"
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 gap-1.5">
              {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                <span className="pointer-events-none text-[10px] font-semibold text-amber-700 bg-amber-100/90 rounded-md px-1.5 py-0.5">
                  {3 - searchQuery.trim().length} more
                </span>
              )}
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition rounded-lg hover:bg-slate-200/60"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
