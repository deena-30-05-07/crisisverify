import { Claim, ClaimsFilter, TrendingClaim, User } from "../types";

const API_BASE = "/api";

export async function fetchClaims(filter: ClaimsFilter = {}): Promise<{ claims: Claim[]; total: number }> {
  const params = new URLSearchParams();
  if (filter.crisisType && filter.crisisType !== "All") params.append("crisisType", filter.crisisType);
  if (filter.credibilityBadge && filter.credibilityBadge !== "All") params.append("credibilityBadge", filter.credibilityBadge);
  if (filter.timeRange) params.append("timeRange", filter.timeRange);
  if (filter.sortBy) params.append("sortBy", filter.sortBy);
  if (filter.searchQuery) params.append("search", filter.searchQuery);

  const res = await fetch(`${API_BASE}/claims?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch claims");
  return res.json();
}

export async function fetchClaimById(claimId: string): Promise<Claim> {
  const res = await fetch(`${API_BASE}/claims/${claimId}`);
  if (!res.ok) throw new Error("Claim not found");
  return res.json();
}

export async function submitClaim(data: {
  title: string;
  description: string;
  imageUrl?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  crisisType?: string;
  userId: string;
  username: string;
}): Promise<{ claim: Claim; claimId: string; credibilityScore: number; credibilityBadge: string }> {
  const res = await fetch(`${API_BASE}/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to submit claim");
  }
  return res.json();
}

export async function voteClaim(claimId: string, userId: string, voteType: "helpful" | "misleading"): Promise<{
  claim: Claim;
  userVote: "helpful" | "misleading" | null;
  credibilityBadge: string;
}> {
  const res = await fetch(`${API_BASE}/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claimId, userId, voteType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to vote");
  }
  return res.json();
}

export async function fetchUserVotes(userId: string): Promise<Record<string, "helpful" | "misleading">> {
  const res = await fetch(`${API_BASE}/votes/user/${userId}`);
  if (!res.ok) return {};
  return res.json();
}

export async function fetchTrendingClaims(): Promise<TrendingClaim[]> {
  const res = await fetch(`${API_BASE}/trending`);
  if (!res.ok) return [];
  return res.json();
}

export async function loginUser(credentials: { email?: string; username?: string }): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to log in");
  }
  return res.json();
}

export async function signupUser(data: { username: string; email?: string }): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to sign up");
  }
  return res.json();
}

export async function guestLogin(): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to create guest session");
  return res.json();
}

export async function fetchUserProfile(userId: string): Promise<User & { recentClaims?: Claim[] }> {
  const res = await fetch(`${API_BASE}/auth/user/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

// Real-time Server-Sent Events subscriber
export function subscribeToRealtimeUpdates(callbacks: {
  onClaimCreated?: (claim: Claim) => void;
  onVoteUpdated?: (data: { claimId: string; claim: Claim; userVote: string | null }) => void;
  onConnected?: () => void;
}): () => void {
  let eventSource: EventSource | null = null;
  let retryTimer: any = null;

  function connect() {
    try {
      eventSource = new EventSource(`${API_BASE}/events`);

      eventSource.addEventListener("connected", () => {
        callbacks.onConnected?.();
      });

      eventSource.addEventListener("claim_created", (e) => {
        try {
          const claim = JSON.parse(e.data);
          callbacks.onClaimCreated?.(claim);
        } catch (err) {
          console.error("SSE parse error for claim_created:", err);
        }
      });

      eventSource.addEventListener("vote_updated", (e) => {
        try {
          const data = JSON.parse(e.data);
          callbacks.onVoteUpdated?.(data);
        } catch (err) {
          console.error("SSE parse error for vote_updated:", err);
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after 3 seconds
        clearTimeout(retryTimer);
        retryTimer = setTimeout(connect, 3000);
      };
    } catch (err) {
      console.warn("EventSource connection error:", err);
    }
  }

  connect();

  return () => {
    clearTimeout(retryTimer);
    eventSource?.close();
  };
}
