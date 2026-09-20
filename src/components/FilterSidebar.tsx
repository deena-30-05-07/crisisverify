import React from "react";
import { Search, Filter, RefreshCw, Flame, CheckCircle, XCircle, HelpCircle, Calendar, ArrowUpDown } from "lucide-react";
import { ClaimsFilter, Claim, CrisisType, CredibilityBadge } from "../types";

interface FilterSidebarProps {
  filter: ClaimsFilter;
  setFilter: React.Dispatch<React.SetStateAction<ClaimsFilter>>;
  claims: Claim[];
  onReset: () => void;
}

const crisisCategories: { label: string; value: string }[] = [
  { label: "All Emergencies", value: "All" },
  { label: "Flood", value: "Flood" },
  { label: "Earthquake", value: "Earthquake" },
  { label: "Wildfire", value: "Wildfire" },
  { label: "Pandemic", value: "Pandemic" },
  { label: "Hurricane", value: "Hurricane" },
  { label: "Industrial Disaster", value: "Industrial Disaster" },
  { label: "Mass Casualty", value: "Mass Casualty" },
  { label: "Severe Storm", value: "Severe Storm" },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filter,
  setFilter,
  claims,
  onReset,
}) => {
  // Count claims per crisis type
  const getCrisisCount = (type: string) => {
    if (type === "All") return claims.length;
    return claims.filter((c) => c.crisisType.toLowerCase() === type.toLowerCase()).length;
  };

  // Count claims per credibility badge
  const getBadgeCount = (badge: CredibilityBadge | "All") => {
    if (badge === "All") return claims.length;
    return claims.filter((c) => c.credibilityBadge === badge).length;
  };

  const hasActiveFilters =
    (filter.crisisType && filter.crisisType !== "All") ||
    (filter.credibilityBadge && filter.credibilityBadge !== "All") ||
    (filter.timeRange && filter.timeRange !== "all") ||
    (filter.searchQuery && filter.searchQuery.trim() !== "");

  return (
    <aside className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-6">
      {/* Top Header & Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Filter className="w-4 h-4 text-red-600" />
          <span>Filters &amp; Search</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Search Input */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Search Reports
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="filter-search-input"
            type="text"
            placeholder="Search keywords, city, bridge..."
            value={filter.searchQuery || ""}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden bg-gray-50/50 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Credibility Status Filter */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Credibility Status
        </label>
        <div className="space-y-1.5">
          <button
            onClick={() => setFilter((prev) => ({ ...prev, credibilityBadge: "All" }))}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              !filter.credibilityBadge || filter.credibilityBadge === "All"
                ? "bg-gray-900 text-white shadow-xs"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">All Statuses</span>
            <span className="text-[11px] opacity-75">{getBadgeCount("All")}</span>
          </button>

          <button
            onClick={() => setFilter((prev) => ({ ...prev, credibilityBadge: "Verified" }))}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter.credibilityBadge === "Verified"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              🟢 Verified (60%+ consensus)
            </span>
            <span className="text-[11px] opacity-90">{getBadgeCount("Verified")}</span>
          </button>

          <button
            onClick={() => setFilter((prev) => ({ ...prev, credibilityBadge: "False" }))}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter.credibilityBadge === "False"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-red-50/60 text-red-800 hover:bg-red-100/80 border border-red-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5" />
              🔴 Marked False (Hoaxes)
            </span>
            <span className="text-[11px] opacity-90">{getBadgeCount("False")}</span>
          </button>

          <button
            onClick={() => setFilter((prev) => ({ ...prev, credibilityBadge: "Unverified" }))}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter.credibilityBadge === "Unverified"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50/60 text-amber-800 hover:bg-amber-100/80 border border-amber-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5" />
              🟡 Unverified (Investigating)
            </span>
            <span className="text-[11px] opacity-90">{getBadgeCount("Unverified")}</span>
          </button>
        </div>
      </div>

      {/* Crisis Type Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Crisis Type
          </label>
          {filter.crisisType && filter.crisisType !== "All" && (
            <span className="text-[11px] font-semibold text-red-600">
              {getCrisisCount(filter.crisisType)} claims
            </span>
          )}
        </div>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {crisisCategories.map((cat) => {
            const isSelected = (!filter.crisisType && cat.value === "All") || filter.crisisType === cat.value;
            const count = getCrisisCount(cat.value);
            return (
              <button
                key={cat.value}
                id={`filter-crisis-${cat.value.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setFilter((prev) => ({ ...prev, crisisType: cat.value }))}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${
                  isSelected
                    ? "bg-red-50 text-red-700 font-bold border border-red-200"
                    : "text-gray-600 hover:bg-gray-100 font-medium"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-red-200 text-red-800" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort By & Time Range */}
      <div className="pt-4 border-t border-gray-100 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            Sort By
          </label>
          <select
            id="filter-sort-select"
            value={filter.sortBy || "newest"}
            onChange={(e) => setFilter((prev) => ({ ...prev, sortBy: e.target.value as any }))}
            className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-gray-300 bg-white text-gray-800 focus:border-red-500 outline-hidden"
          >
            <option value="newest">Most Recent Reports</option>
            <option value="votes">Highest Community Engagement</option>
            <option value="misleading">Most Flagged as False</option>
            <option value="verified">Most Upvoted as Helpful</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            Time Range
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "All Time", value: "all" },
              { label: "24 Hours", value: "24h" },
              { label: "3 Days", value: "3d" },
              { label: "7 Days", value: "7d" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setFilter((prev) => ({ ...prev, timeRange: t.value as any }))}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  (filter.timeRange || "all") === t.value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
