import React, { useState } from "react";
import {
  X,
  MapPin,
  Clock,
  ThumbsUp,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  HelpCircle,
  Share2,
  Sparkles,
  Check,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Claim, CredibilityBadge } from "../types";

interface ClaimDetailModalProps {
  claim: Claim | null;
  onClose: () => void;
  userVote?: "helpful" | "misleading" | null;
  onVote: (claimId: string, voteType: "helpful" | "misleading") => void;
  isVoting?: boolean;
}

export const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({
  claim,
  onClose,
  userVote,
  onVote,
  isVoting = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!claim) return null;

  const total = claim.helpfulVotes + claim.misleadingVotes;
  const helpfulPercent = total > 0 ? Math.round((claim.helpfulVotes / total) * 100) : 50;
  const misleadingPercent = 100 - helpfulPercent;

  const handleShare = () => {
    const text = `[Fact-Check: ${claim.credibilityBadge.toUpperCase()}] "${claim.title}" - Verified on CrisisVerify: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderBadge = (badge: CredibilityBadge) => {
    switch (badge) {
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            🟢 Verified by Community &amp; AI
          </span>
        );
      case "False":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <ShieldX className="w-4 h-4 text-red-600" />
            🔴 Marked False / Hoax
          </span>
        );
      case "Unverified":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            🟡 Unverified / Active Investigation
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-600 text-white">
              {claim.crisisType}
            </span>
            <span className="text-xs text-gray-400">
              ID: {claim.claimId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied Debunk" : "Share Fact-Check"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Warning Banner if Marked False */}
          {claim.credibilityBadge === "False" && (
            <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900">
                  ⚠️ MISINFORMATION WARNING: This claim has been marked FALSE
                </h4>
                <p className="text-xs text-red-800 mt-1 leading-relaxed">
                  Community reports and AI credibility analysis confirm this report contains deceptive, manipulated, or fabricated information. Do not share or forward this claim to avoid exacerbating emergency chaos.
                </p>
                {claim.spreadRate && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    <TrendingUp className="w-3 h-3 text-red-600" />
                    Spreading speed: {claim.spreadRate}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title & Metadata */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {claim.location && (
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {claim.location}
                  </span>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(claim.timestamp).toLocaleString()}
                </span>
              </div>

              <div>{renderBadge(claim.credibilityBadge)}</div>
            </div>

            <h2 className="text-2xl font-black text-gray-950 leading-snug">
              {claim.title}
            </h2>

            <p className="mt-3 text-base text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200">
              {claim.description}
            </p>
          </div>

          {/* Image Evidence if present */}
          {claim.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-black/5">
              <img
                src={claim.imageUrl}
                alt={claim.title}
                className="w-full max-h-96 object-contain mx-auto"
              />
            </div>
          )}

          {/* AI Credibility Analysis Breakdown */}
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 text-white p-6 shadow-md">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  AI Credibility &amp; Red Flag Audit
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                Model: {claim.aiAnalysis.modelUsed}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 flex flex-col justify-center">
                <span className="text-xs text-gray-400 uppercase font-semibold">Credibility Index</span>
                <div className="text-3xl font-black mt-1 text-white flex items-baseline gap-1">
                  {claim.aiCredibilityScore}
                  <span className="text-sm font-normal text-gray-400">/ 100</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      claim.aiCredibilityScore >= 70
                        ? "bg-emerald-500"
                        : claim.aiCredibilityScore <= 35
                        ? "bg-red-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${claim.aiCredibilityScore}%` }}
                  />
                </div>
              </div>

              <div className="sm:col-span-2 bg-gray-800/80 p-4 rounded-xl border border-gray-700">
                <span className="text-xs text-gray-400 uppercase font-semibold block mb-1">
                  Analyst Reasoning
                </span>
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed italic">
                  "{claim.aiAnalysis.reasoning}"
                </p>
              </div>
            </div>

            {/* Red Flags & Evidence */}
            <div className="space-y-3 text-xs">
              {claim.aiAnalysis.redFlags && claim.aiAnalysis.redFlags.length > 0 && (
                <div className="bg-red-950/40 border border-red-800/60 p-3.5 rounded-xl">
                  <span className="font-bold text-red-400 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    Key Red Flags Detected:
                  </span>
                  <ul className="space-y-1.5 text-red-200">
                    {claim.aiAnalysis.redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {claim.aiAnalysis.supportingEvidence && claim.aiAnalysis.supportingEvidence.length > 0 && (
                <div className="bg-emerald-950/40 border border-emerald-800/60 p-3.5 rounded-xl">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Supporting Evidentiary Matches:
                  </span>
                  <ul className="space-y-1.5 text-emerald-200">
                    {claim.aiAnalysis.supportingEvidence.map((ev, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Community Voting Consensus Section */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Community Fact-Check Consensus
                </h4>
                <p className="text-xs text-gray-500">
                  A badge updates to Verified (60%+ helpful) or False (60%+ misleading) once verified by field participants.
                </p>
              </div>

              <div className="text-xs font-semibold text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                Total Cast Votes: <span className="text-gray-950 font-black">{total}</span>
              </div>
            </div>

            {/* Voting Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-700">Helpful &amp; Accurate ({helpfulPercent}%)</span>
                <span className="text-red-700">Misleading or Fabricated ({misleadingPercent}%)</span>
              </div>
              <div className="h-3 w-full bg-red-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${helpfulPercent}%` }}
                />
              </div>
            </div>

            {/* Vote Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                id={`modal-vote-helpful-${claim.claimId}`}
                onClick={() => onVote(claim.claimId, "helpful")}
                disabled={isVoting}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  userVote === "helpful"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-white text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Vote Helpful ({claim.helpfulVotes})</span>
              </button>

              <button
                id={`modal-vote-misleading-${claim.claimId}`}
                onClick={() => onVote(claim.claimId, "misleading")}
                disabled={isVoting}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  userVote === "misleading"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-white text-red-800 border-2 border-red-300 hover:bg-red-50"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Vote Misleading ({claim.misleadingVotes})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-100 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
          >
            Close Fact-Check View
          </button>
        </div>
      </div>
    </div>
  );
};
