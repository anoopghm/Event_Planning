/**
 * API client with automatic JWT token management, Authorization headers,
 * and silent token refresh rotation handling.
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken") || localStorage.getItem("authToken");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

export function setTokens(accessToken: string, refreshToken?: string, user?: unknown) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("authToken", accessToken); // Backwards compatibility
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
  if (user) {
    localStorage.setItem("authUser", JSON.stringify(user));
  }
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("authUser");
}

// Track ongoing refresh promise to prevent concurrent refreshes
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  // If a refresh is already in flight, reuse it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        clearTokens();
        return null;
      }

      const data = await response.json();
      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken, data.user);
        return data.accessToken;
      }

      clearTokens();
      return null;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fetch wrapper that automatically includes the access token and retries once
 * after refreshing the token if a 401 / TOKEN_EXPIRED is encountered.
 */
export async function fetchWithAuth(
  input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  let token = getAccessToken();

  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const updatedInit: RequestInit = {
    ...init,
    headers
  };

  let response = await fetch(input, updatedInit);

  // If 401 Unauthorized, attempt a silent token refresh and retry
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(init.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(input, {
        ...init,
        headers: retryHeaders
      });
    }
  }

  return response;
}

/**
 * Log out user by notifying the server to revoke the refresh token, then clearing local tokens.
 */
export async function logoutUser(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });
    }
  } catch (err) {
    console.error("Logout request failed:", err);
  } finally {
    clearTokens();
  }
}

