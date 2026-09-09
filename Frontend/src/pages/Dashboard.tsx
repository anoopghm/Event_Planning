import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

interface AuthUser {
  id: number;
  name: string;
  email: string;
}

function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState<AuthUser | null>(() => {
    const rawUser = typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
    if (rawUser) {
      try {
        return JSON.parse(rawUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-lg font-bold text-white shadow-sm">
              ✦
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900">
              Event<span className="text-red-500">ly</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-neutral-800">
                {user?.name || "Event Planner"}
              </span>
              <span className="text-xs text-neutral-500">
                {user?.email || "user@example.com"}
              </span>
            </div>

            <Button variant="secondary" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome Banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-8 text-white shadow-md">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-block rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
                Planning Dashboard
              </span>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Welcome, {user?.name || "Planner"}!
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                Manage your venues, guests, schedules, and budgets seamlessly in one place.
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <Button variant="primary">
                + Create New Event
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Upcoming Events
            </span>
            <p className="mt-2 text-3xl font-bold text-neutral-900">4</p>
            <span className="mt-2 inline-block text-xs font-medium text-emerald-600">
              ↑ 2 scheduled this month
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Total RSVPs
            </span>
            <p className="mt-2 text-3xl font-bold text-neutral-900">182</p>
            <span className="mt-2 inline-block text-xs font-medium text-emerald-600">
              ↑ 94% confirmed
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Budget Tracked
            </span>
            <p className="mt-2 text-3xl font-bold text-neutral-900">$12,450</p>
            <span className="mt-2 inline-block text-xs font-medium text-neutral-500">
              Across 3 active events
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Pending Tasks
            </span>
            <p className="mt-2 text-3xl font-bold text-red-500">7</p>
            <span className="mt-2 inline-block text-xs font-medium text-neutral-500">
              Due in the next 48 hours
            </span>
          </div>
        </div>

        {/* Overview Section */}
        <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Active Events Overview
            </h2>
            <button
              type="button"
              className="text-xs font-semibold text-red-500 hover:text-red-600 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="mt-4 divide-y divide-neutral-100">
            <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">
                  Tech Innovators Annual Gala 2026
                </h3>
                <p className="text-xs text-neutral-500">
                  Grand Horizon Ballroom • Oct 24, 2026
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Confirmed
              </span>
            </div>

            <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">
                  Autumn Product Launch & Keynote
                </h3>
                <p className="text-xs text-neutral-500">
                  Convention Center Hall B • Nov 12, 2026
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Planning in Progress
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
