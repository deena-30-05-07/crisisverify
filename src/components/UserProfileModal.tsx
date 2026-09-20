import React from "react";
import { X, Award, FileText, CheckCircle2, ShieldAlert, LogOut, Calendar } from "lucide-react";
import { User, Claim } from "../types";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  userClaims: Claim[];
  onSelectClaim: (claim: Claim) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  userClaims,
  onSelectClaim,
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
          <h3 className="text-base font-bold">Responder Profile &amp; History</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar & User Details */}
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.userId}`}
              alt={user.username}
              className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-red-500 object-cover p-0.5"
            />
            <div>
              <h4 className="text-lg font-bold text-gray-900">{user.username}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                  {user.badgeTitle || (user.isAnonymous ? "Anonymous Responder" : "Community Fact Checker")}
                </span>
                {user.isAnonymous && (
                  <span className="text-xs text-gray-400">(Guest Session)</span>
                )}
              </div>
              {user.email && (
                <p className="text-xs text-gray-500 mt-1">{user.email}</p>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold mb-1">
                <Award className="w-4 h-4 text-amber-500" />
                Reputation Score
              </div>
              <div className="text-2xl font-black text-gray-900">{user.reputation}</div>
              <p className="text-[11px] text-gray-500 mt-0.5">Earned from verified reports</p>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold mb-1">
                <FileText className="w-4 h-4 text-red-500" />
                Reports Submitted
              </div>
              <div className="text-2xl font-black text-gray-900">
                {userClaims.length || user.submissionCount}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Disaster claims filed</p>
            </div>
          </div>

          {/* Submission History */}
          <div>
            <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5">
              Your Incident Reports &amp; Claims ({userClaims.length})
            </h5>

            {userClaims.length === 0 ? (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                No reports submitted yet in this session. Click "Report Misinformation" to audit a claim.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {userClaims.map((claim) => (
                  <div
                    key={claim.claimId}
                    onClick={() => {
                      onClose();
                      onSelectClaim(claim);
                    }}
                    className="p-3 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50/40 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="text-left max-w-[260px]">
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {claim.title}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>{claim.crisisType}</span>
                        <span>•</span>
                        <span>{new Date(claim.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        claim.credibilityBadge === "Verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : claim.credibilityBadge === "False"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {claim.credibilityBadge}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
