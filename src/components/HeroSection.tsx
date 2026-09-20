import React from "react";
import { AlertTriangle, CheckCircle2, Flame, ShieldAlert, Sparkles, Activity } from "lucide-react";
import { Claim } from "../types";

interface HeroSectionProps {
  claims: Claim[];
  onOpenReportModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ claims, onOpenReportModal }) => {
  const verifiedCount = claims.filter((c) => c.credibilityBadge === "Verified").length;
  const falseCount = claims.filter((c) => c.credibilityBadge === "False").length;
  const totalVotesCount = claims.reduce((acc, c) => acc + c.totalVotes, 0);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-red-50/70 via-gray-50 to-gray-50 border-b border-gray-200 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl">
            {/* Urgent emergency badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-red-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <Activity className="w-3.5 h-3.5 animate-pulse text-red-600" />
              Active Emergency Monitoring System
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-950 leading-tight">
              Stop Misinformation. <br className="hidden sm:inline" />
              <span className="text-red-600 underline decoration-red-300 decoration-wavy underline-offset-4">
                Save Lives.
              </span>
            </h1>

            <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
              When disasters strike, panic spreads faster than facts. CrisisVerify combines real-time AI fact-checking with community ground truth to expose dangerous hoaxes and verify critical relief advisories.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                id="hero-report-btn"
                onClick={onOpenReportModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/25 transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                Submit Claim for Immediate AI Verification
              </button>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium px-2 py-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Automated AI credibility audit in &lt; 2.5s</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-semibold uppercase">Hoaxes Flagged</span>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-600">{falseCount}</div>
              <p className="text-[11px] text-gray-500 mt-0.5">Marked false & debunked</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-semibold uppercase">Verified News</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">{verifiedCount}</div>
              <p className="text-[11px] text-gray-500 mt-0.5">60%+ consensus + AI verified</p>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-semibold uppercase">Community Votes</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-gray-900">{totalVotesCount}</div>
              <p className="text-[11px] text-gray-500 mt-0.5">Crowdsourced checks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
