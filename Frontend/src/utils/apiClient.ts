/**
 * API client with secure httpOnly cookie authentication, automatic token refresh,
 * and request retries.
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

export function getAuthUser(): { id: number; name: string; email: string } | null {
  const raw = localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem("authUser"));
}

export function setAuthUser(user: unknown) {
  if (user) {
    localStorage.setItem("authUser", JSON.stringify(user));
  }
}

export function clearAuth() {
  localStorage.removeItem("authUser");
  // Clean up any legacy localStorage tokens
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
}

// Backwards-compatible token setter
export function setTokens(_accessToken?: string, _refreshToken?: string, user?: unknown) {
  if (user) {
    setAuthUser(user);
  }
}

export function clearTokens() {
  clearAuth();
}

// Track ongoing refresh promise to prevent concurrent refresh requests
let refreshPromise: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
  // If a refresh is already in flight, reuse it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      // The browser automatically attaches the httpOnly refreshToken cookie via credentials: "include"
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (!response.ok) {
        clearAuth();
        return false;
      }

      const data = await response.json();
      if (data.user) {
        setAuthUser(data.user);
      }
      return true;
    } catch {
      clearAuth();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fetch wrapper that sends httpOnly cookies via credentials: "include"
 * and automatically retries after refreshing tokens if a 401 / TOKEN_EXPIRED occurs.
 */
export async function fetchWithAuth(
  input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  const updatedInit: RequestInit = {
    ...init,
    credentials: "include"
  };

  let response = await fetch(input, updatedInit);

  // If 401 Unauthorized, attempt a silent token refresh via httpOnly cookies and retry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(input, updatedInit);
    }
  }

  return response;
}

/**
 * Log out user by calling backend to clear httpOnly cookies and revoke tokens in MySQL
 */
export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
  } catch (err) {
    console.error("Logout request failed:", err);
  } finally {
    clearAuth();
  }
}
