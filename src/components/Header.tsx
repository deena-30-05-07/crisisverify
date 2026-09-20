import React from "react";
import { ShieldAlert, PlusCircle, MapPin, List, User as UserIcon, Radio, Sparkles } from "lucide-react";
import { User } from "../types";

interface HeaderProps {
  user: User | null;
  activeView: "feed" | "map";
  setActiveView: (view: "feed" | "map") => void;
  onOpenReportModal: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  isRealtimeConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeView,
  setActiveView,
  onOpenReportModal,
  onOpenAuthModal,
  onOpenProfileModal,
  isRealtimeConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-gray-900">
                  Crisis<span className="text-red-600">Verify</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                  EMERGENCY HUB
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden md:block">
                Real-Time Misinformation Combat & Fact-Checking
              </p>
            </div>
          </div>

          {/* Real-time Indicator & View Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600 font-medium">
              <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
              <span className="truncate">{isRealtimeConnected ? "Real-Time Sync Active" : "Connecting Live..."}</span>
            </div>

            {/* Prominent View Switcher */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
              <button
                id="view-feed-btn"
                onClick={() => setActiveView("feed")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === "feed"
                    ? "bg-white text-gray-950 shadow-xs border border-gray-200/80"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <List className="w-3.5 h-3.5 text-gray-600" />
                <span>Live Feed</span>
              </button>
              <button
                id="view-map-btn"
                onClick={() => setActiveView("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === "map"
                    ? "bg-red-600 text-white shadow-xs font-bold"
                    : "text-gray-600 hover:text-red-700"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Crisis Map</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Report Button */}
            <button
              id="report-misinformation-header-btn"
              onClick={onOpenReportModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold shadow-xs hover:shadow transition-all whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Misinformation</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* User Profile / Auth */}
            {user ? (
              <button
                id="user-profile-header-btn"
                onClick={onOpenProfileModal}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-all text-xs font-medium"
              >
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.userId}`}
                  alt={user.username}
                  className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 object-cover"
                />
                <div className="text-left hidden md:block">
                  <div className="font-semibold text-gray-900 text-xs truncate max-w-[110px]">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    {user.reputation} Rep • {user.isAnonymous ? "Guest" : "Verified"}
                  </div>
                </div>
              </button>
            ) : (
              <button
                id="sign-in-header-btn"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-all"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
