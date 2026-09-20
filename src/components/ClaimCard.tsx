import React, { useState } from "react";
import {
  ThumbsUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  User as UserIcon,
  ShieldCheck,
  ShieldX,
  HelpCircle,
  ExternalLink,
  Share2,
  Sparkles,
} from "lucide-react";
import { Claim, CredibilityBadge, CrisisType } from "../types";

interface ClaimCardProps {
  claim: Claim;
  userVote?: "helpful" | "misleading" | null;
  onVote: (claimId: string, voteType: "helpful" | "misleading") => void;
  onSelectClaim: (claim: Claim) => void;
  isVoting?: boolean;
}

// Crisis Type tag badge colors
const crisisTypeColors: Record<CrisisType, { bg: string; text: string; border: string }> = {
  Flood: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Earthquake: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  Wildfire: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Pandemic: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Hurricane: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  "Industrial Disaster": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  "Mass Casualty": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Severe Storm": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  "General Emergency": { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

export const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  userVote,
  onVote,
  onSelectClaim,
  isVoting = false,
}) => {
  const [isAIExpanded, setIsAIExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Time format helper
  const formatTimeAgo = (isoString: string) => {
    const diffSeconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Credibility Badge config matching spec:
  // 🟢 Green "Verified": Community consensus + AI agrees (60%+ helpful votes)
  // 🔴 Red "False": Community consensus + AI flags as false (60%+ misleading votes)
  // 🟡 Yellow "Unverified": Mixed votes or low vote count
  const renderBadge = (badge: CredibilityBadge) => {
    switch (badge) {
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            🟢 Verified
          </span>
        );
      case "False":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-300 shadow-xs">
            <ShieldX className="w-4 h-4 text-red-600 shrink-0" />
            🔴 Marked False
          </span>
        );
      case "Unverified":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            🟡 Unverified
          </span>
        );
    }
  };

  const crisisStyle = crisisTypeColors[claim.crisisType] || crisisTypeColors["General Emergency"];

  // Consensus percentage
  const total = claim.helpfulVotes + claim.misleadingVotes;
  const helpfulPercent = total > 0 ? Math.round((claim.helpfulVotes / total) * 100) : 50;

  const handleCopyShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}#claim=${claim.claimId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      id={`claim-card-${claim.claimId}`}
      className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between"
    >
      <div className="p-5">
        {/* Top Header Row: Crisis Pill + Location + Credibility Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${crisisStyle.bg} ${crisisStyle.text} ${crisisStyle.border}`}
            >
              {claim.crisisType}
            </span>

            {claim.location && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {claim.location}
              </span>
            )}
          </div>

          <div>{renderBadge(claim.credibilityBadge)}</div>
        </div>

        {/* Claim Title */}
        <h3
          onClick={() => onSelectClaim(claim)}
          className="text-lg font-bold text-gray-900 leading-snug cursor-pointer hover:text-red-600 transition-colors"
        >
          {claim.title}
        </h3>

        {/* Claim Description (capped at ~200 characters visible) */}
        <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-3">
          {claim.description}
        </p>

        {/* Attached image preview if available */}
        {claim.imageUrl && (
          <div
            onClick={() => onSelectClaim(claim)}
            className="mt-3 relative rounded-xl overflow-hidden bg-gray-100 max-h-52 cursor-pointer border border-gray-200"
          >
            <img
              src={claim.imageUrl}
              alt={claim.title}
              className="w-full h-48 object-cover hover:scale-102 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium backdrop-blur-xs">
              Click to view evidence
            </div>
          </div>
        )}

        {/* Submitter info & timestamp */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {claim.userAvatar ? (
              <img
                src={claim.userAvatar}
                alt={claim.username}
                className="w-6 h-6 rounded-full bg-gray-200 object-cover border border-gray-200"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="font-semibold text-gray-700 truncate max-w-[140px] sm:max-w-[200px]">
              {claim.username}
            </span>
          </div>

          <div className="flex items-center gap-1 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimeAgo(claim.timestamp)}</span>
          </div>
        </div>

        {/* AI Analysis Accordion preview */}
        <div className="mt-3 bg-gray-50 rounded-xl border border-gray-200/80 overflow-hidden">
          <button
            onClick={() => setIsAIExpanded(!isAIExpanded)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-800 hover:bg-gray-100/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Credibility Score:</span>
              <span
                className={`font-black px-2 py-0.5 rounded ${
                  claim.aiCredibilityScore >= 70
                    ? "bg-emerald-100 text-emerald-800"
                    : claim.aiCredibilityScore <= 35
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {claim.aiCredibilityScore}%
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 font-normal">
              <span>{isAIExpanded ? "Hide Reasoning" : "Inspect Analysis"}</span>
              {isAIExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {isAIExpanded && (
            <div className="p-3.5 pt-1 text-xs text-gray-700 border-t border-gray-200/60 space-y-2.5">
              <p className="leading-relaxed italic bg-white p-2.5 rounded-lg border border-gray-100 text-gray-800">
                "{claim.aiAnalysis.reasoning}"
              </p>

              {claim.aiAnalysis.redFlags && claim.aiAnalysis.redFlags.length > 0 && (
                <div>
                  <span className="font-bold text-red-700 flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Key Red Flags Detected:
                  </span>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                    {claim.aiAnalysis.redFlags.map((flag, idx) => (
                      <li key={idx} className="text-[11px] leading-snug">
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {claim.aiAnalysis.supportingEvidence && claim.aiAnalysis.supportingEvidence.length > 0 && (
                <div>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Supporting Evidence Patterns:
                  </span>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                    {claim.aiAnalysis.supportingEvidence.map((ev, idx) => (
                      <li key={idx} className="text-[11px] leading-snug">
                        {ev}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1">
                <span>Model: {claim.aiAnalysis.modelUsed}</span>
                <button
                  onClick={() => onSelectClaim(claim)}
                  className="text-red-600 hover:text-red-700 font-semibold underline underline-offset-2"
                >
                  View full audit breakdown →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Voting & Action Bar */}
      <div className="bg-gray-50/80 px-5 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Community Voting System */}
        <div className="flex items-center gap-2">
          {/* Helpful Button */}
          <button
            id={`vote-helpful-${claim.claimId}`}
            onClick={() => onVote(claim.claimId, "helpful")}
            disabled={isVoting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              userVote === "helpful"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
            }`}
            title="Mark as Helpful & Accurate"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Helpful</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                userVote === "helpful" ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {claim.helpfulVotes}
            </span>
          </button>

          {/* Misleading Button */}
          <button
            id={`vote-misleading-${claim.claimId}`}
            onClick={() => onVote(claim.claimId, "misleading")}
            disabled={isVoting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              userVote === "misleading"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            }`}
            title="Mark as Misleading or False"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Misleading</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                userVote === "misleading" ? "bg-red-700 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {claim.misleadingVotes}
            </span>
          </button>
        </div>

        {/* Consensus distribution bar + Share/Detail actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {total > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
              <span className="text-emerald-600 font-bold">{helpfulPercent}%</span>
              <div className="w-16 h-1.5 bg-red-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${helpfulPercent}%` }}
                />
              </div>
              <span className="text-red-600 font-bold">{100 - helpfulPercent}%</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyShare}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors"
              title="Share claim report"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {copied && <span className="text-[10px] text-emerald-600 font-bold">Link Copied!</span>}

            <button
              onClick={() => onSelectClaim(claim)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-200/60 transition-colors"
            >
              Details
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
