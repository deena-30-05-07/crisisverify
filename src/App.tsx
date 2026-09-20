import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { TrendingAlerts } from "./components/TrendingAlerts";
import { ClaimCard } from "./components/ClaimCard";
import { FilterSidebar } from "./components/FilterSidebar";
import { ClaimModal } from "./components/ClaimModal";
import { ClaimDetailModal } from "./components/ClaimDetailModal";
import { CrisisMap } from "./components/CrisisMap";
import { AuthModal } from "./components/AuthModal";
import { UserProfileModal } from "./components/UserProfileModal";
import { Footer } from "./components/Footer";
import { Claim, ClaimsFilter, TrendingClaim, User } from "./types";
import {
  fetchClaims,
  fetchTrendingClaims,
  voteClaim,
  fetchUserVotes,
  guestLogin,
  subscribeToRealtimeUpdates,
} from "./services/api";
import {
  AlertCircle,
  CheckCircle,
  PlusCircle,
  Search,
  Filter,
  Flame,
  Radio,
  RefreshCw,
  Share2,
} from "lucide-react";

export default function App() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [trendingClaims, setTrendingClaims] = useState<TrendingClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Authentication State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("crisisverify_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [userVotes, setUserVotes] = useState<Record<string, "helpful" | "misleading">>({});

  // Filter State
  const [filter, setFilter] = useState<ClaimsFilter>({
    crisisType: "All",
    credibilityBadge: "All",
    timeRange: "all",
    sortBy: "newest",
    searchQuery: "",
  });

  // UI Navigation & Modals
  const [activeView, setActiveView] = useState<"feed" | "map">("feed");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Toast Notification System
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "warning" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Initialize Anonymous Guest User if none exists
  useEffect(() => {
    if (!user) {
      guestLogin()
        .then((res) => {
          setUser(res.user);
          localStorage.setItem("crisisverify_user", JSON.stringify(res.user));
        })
        .catch((err) => console.warn("Guest login initial error:", err));
    }
  }, [user]);

  // Load claims data
  const loadClaims = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchClaims(filter);
      setClaims(data.claims);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching claims:", err);
      setError("Failed to load claims. Trying to reconnect...");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Load trending claims
  const loadTrending = useCallback(async () => {
    try {
      const trending = await fetchTrendingClaims();
      setTrendingClaims(trending);
    } catch (err) {
      console.warn("Trending claims error:", err);
    }
  }, []);

  // Load user votes if user is logged in
  useEffect(() => {
    if (user?.userId) {
      fetchUserVotes(user.userId).then((votes) => {
        setUserVotes(votes);
      });
    }
  }, [user?.userId]);

  // Initial load
  useEffect(() => {
    loadClaims();
    loadTrending();
  }, [loadClaims, loadTrending]);

  // Real-time updates subscription via SSE
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeUpdates({
      onConnected: () => {
        setIsRealtimeConnected(true);
      },
      onClaimCreated: (newClaim: Claim) => {
        setClaims((prev) => {
          // Avoid duplicate
          if (prev.some((c) => c.claimId === newClaim.claimId)) return prev;
          return [newClaim, ...prev];
        });
        showToast(`🚨 New claim filed: "${newClaim.title.slice(0, 45)}..."`, "warning");
        loadTrending();
      },
      onVoteUpdated: (data) => {
        setClaims((prev) =>
          prev.map((c) => (c.claimId === data.claimId ? { ...c, ...data.claim } : c))
        );
        setSelectedClaim((prev) => (prev?.claimId === data.claimId ? { ...prev, ...data.claim } : prev));
        loadTrending();
      },
    });

    return () => {
      unsubscribe();
    };
  }, [showToast, loadTrending]);

  // Voting handler
  const handleVote = async (claimId: string, voteType: "helpful" | "misleading") => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsVoting(true);
    const prevVote = userVotes[claimId];

    // Optimistic UI update
    setUserVotes((prev) => {
      const copy = { ...prev };
      if (prevVote === voteType) {
        delete copy[claimId];
      } else {
        copy[claimId] = voteType;
      }
      return copy;
    });

    try {
      const res = await voteClaim(claimId, user.userId, voteType);
      // Update claim in list
      setClaims((prev) =>
        prev.map((c) => (c.claimId === claimId ? { ...c, ...res.claim } : c))
      );
      if (selectedClaim?.claimId === claimId) {
        setSelectedClaim((prev) => (prev ? { ...prev, ...res.claim } : null));
      }

      if (res.userVote) {
        showToast(
          res.userVote === "helpful"
            ? "Voted Helpful. Thank you for corroborating emergency ground truth!"
            : "Voted Misleading. Hoax flag recorded to alert responders.",
          "success"
        );
      } else {
        showToast("Vote retracted.", "warning");
      }

      loadTrending();
    } catch (err: any) {
      // Revert optimistic update
      setUserVotes((prev) => ({ ...prev, [claimId]: prevVote as any }));
      showToast(err.message || "Failed to submit vote.", "error");
    } finally {
      setIsVoting(false);
    }
  };

  const handleClaimSubmitted = (newClaim: Claim) => {
    setClaims((prev) => [newClaim, ...prev]);
    showToast("Claim submitted & verified with AI credibility scoring!", "success");
    loadTrending();
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("crisisverify_user", JSON.stringify(loggedInUser));
    showToast(`Welcome, ${loggedInUser.username}!`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("crisisverify_user");
    setUser(null);
    setUserVotes({});
    showToast("Signed out. Guest session initiated.", "warning");
  };

  const handleResetFilters = () => {
    setFilter({
      crisisType: "All",
      credibilityBadge: "All",
      timeRange: "all",
      sortBy: "newest",
      searchQuery: "",
    });
  };

  const userClaims = claims.filter((c) => c.userId === user?.userId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-red-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-600 border border-emerald-500"
              : toast.type === "warning"
              ? "bg-amber-600 border border-amber-500"
              : "bg-red-600 border border-red-500"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <Header
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        isRealtimeConnected={isRealtimeConnected}
      />

      {/* Hero Broadcast Section */}
      <HeroSection
        claims={claims}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Trending Misinformation Alerts Dashboard */}
        <TrendingAlerts
          trendingClaims={trendingClaims}
          onSelectClaim={(claim) => setSelectedClaim(claim)}
        />

        {/* View Switching (Feed vs Crisis Map) */}
        {activeView === "map" ? (
          <CrisisMap
            claims={claims}
            onSelectClaim={(claim) => setSelectedClaim(claim)}
            onSwitchToFeed={() => setActiveView("feed")}
          />
        ) : (
          /* 2-Column Responsive Layout: Sidebar Filters + Main Claims Feed */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Filter Sidebar */}
            <div className="lg:col-span-1">
              <FilterSidebar
                filter={filter}
                setFilter={setFilter}
                claims={claims}
                onReset={handleResetFilters}
              />
            </div>

            {/* Right Main Claim Feed */}
            <section className="lg:col-span-3 space-y-4">
              {/* Feed Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <h2 className="text-sm font-bold text-gray-900">
                    Live Emergency Feed
                  </h2>
                  <span className="text-xs text-gray-500 font-medium">
                    ({claims.length} reports total)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>
                    Showing:{" "}
                    <strong className="text-gray-900">
                      {filter.crisisType === "All" ? "All Crises" : filter.crisisType}
                    </strong>
                  </span>
                  <span>•</span>
                  <button
                    onClick={loadClaims}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    title="Refresh claims"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    onClick={loadClaims}
                    className="underline font-bold hover:text-red-900"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Claims List */}
              {loading && claims.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-44 bg-white rounded-2xl border border-gray-200 animate-pulse p-6 space-y-3"
                    >
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-6 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : claims.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    No Emergency Reports Found
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    No claims currently match your active filters. Try adjusting your crisis type or search criteria, or submit a new report.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <ClaimCard
                      key={claim.claimId}
                      claim={claim}
                      userVote={userVotes[claim.claimId]}
                      onVote={handleVote}
                      onSelectClaim={(c) => setSelectedClaim(c)}
                      isVoting={isVoting}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Claim Submission Modal */}
      <ClaimModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        user={user}
        onClaimSubmitted={handleClaimSubmitted}
        onRequireAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Claim Detail Modal */}
      <ClaimDetailModal
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
        userVote={selectedClaim ? userVotes[selectedClaim.claimId] : undefined}
        onVote={handleVote}
        isVoting={isVoting}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onLogout={handleLogout}
        userClaims={userClaims}
        onSelectClaim={(claim) => setSelectedClaim(claim)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
