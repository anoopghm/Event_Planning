import { useState, useRef, useEffect } from "react";
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
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 gap-2 sm:gap-4">
        {/* Left Section: Mobile Menu Toggle (Mobile only) + Logo (Home/Dashboard) + Desktop Navigation Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Drawer Toggle Button ("=") - Visible ONLY on mobile (< md) */}
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex md:hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-800 shadow-xs hover:border-neutral-400 hover:bg-neutral-50 active:scale-95 transition cursor-pointer"
            title="Open Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <svg
              className="h-5 w-5 text-neutral-800"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </svg>
          </button>

          {/* Logo (Home / Return to Dashboard) */}
          <button
            type="button"
            onClick={() => onViewChange("dashboard")}
            className="group flex shrink-0 items-center gap-2 cursor-pointer select-none focus:outline-none"
            title="Evently - Return to Dashboard"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-red-500 text-base font-bold text-white shadow-xs transition group-hover:scale-105 group-hover:bg-red-600">
              ✦
            </div>
            <span className="hidden sm:inline text-lg sm:text-xl font-bold tracking-tight text-neutral-900 transition group-hover:text-red-600">
              Evently
            </span>
          </button>

          {/* Desktop Navigation Buttons: My Events & Create (Hidden on mobile, accessible via drawer on mobile) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-2.5">
            {/* My Events Button */}
            <button
              type="button"
              onClick={() => onViewChange("my-events")}
              className={`flex items-center gap-2 rounded-xl px-4 lg:px-5 py-2.5 text-xs lg:text-sm font-semibold transition cursor-pointer shrink-0 border ${
                currentView === "my-events"
                  ? "bg-neutral-900 border-neutral-900 text-white shadow-xs"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 hover:border-neutral-400"
              }`}
              title="View My Events"
            >
              <svg
                className="h-4.5 w-4.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>My Events</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  currentView === "my-events"
                    ? "bg-white/20 text-white"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {eventsCount}
              </span>
            </button>

            {/* Create Button: Evently Red & Broad */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-4 lg:px-5 py-2.5 text-xs lg:text-sm font-semibold shadow-xs hover:shadow-sm transition cursor-pointer shrink-0"
              title="Create a new event"
            >
              <svg
                className="h-4.5 w-4.5 shrink-0 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Center Section: Responsive Broad Search Bar */}
        <div className="flex-1 min-w-0 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-3.5 text-neutral-400">
              <svg
                className="h-4 w-4 sm:h-4.5 sm:w-4.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search events..."
              className="w-full h-10 sm:h-11 rounded-xl border border-neutral-300 bg-neutral-50/90 py-2 sm:py-2.5 pl-9 sm:pl-10 pr-8 sm:pr-9 text-xs sm:text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 sm:pr-3 text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Mobile Quick Create + User Profile Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Quick Create Icon Button (Visible only on mobile screens < md) */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-xs transition cursor-pointer"
            title="Create new event"
            aria-label="Create new event"
          >
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          {/* User Profile & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 rounded-xl border border-neutral-200 bg-white p-1.5 sm:px-3 sm:py-2 text-left transition hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer focus:outline-none shadow-2xs"
              aria-expanded={isDropdownOpen}
              aria-label="User profile menu"
            >
              {/* Avatar Circle */}
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-neutral-200 text-neutral-600">
                <svg
                  className="h-4.5 w-4.5 sm:h-5 sm:w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>

              {/* User Name & Email (desktop only) */}
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-xs font-bold text-neutral-900 truncate max-w-[130px]">
                  {user.name}
                </span>
                <span className="text-[11px] text-neutral-500 font-normal truncate max-w-[130px]">
                  {user.email}
                </span>
              </div>

              {/* Chevron Icon */}
              <svg
                className={`hidden sm:block h-4 w-4 text-neutral-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95">
                {/* Header profile info */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Sign out */}
                <div className="mt-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
