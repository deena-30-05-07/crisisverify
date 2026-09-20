import React from "react";
import { AlertOctagon, TrendingUp, ArrowRight, ShieldAlert, Zap } from "lucide-react";
import { TrendingClaim, Claim } from "../types";

interface TrendingAlertsProps {
  trendingClaims: TrendingClaim[];
  onSelectClaim: (claim: Claim) => void;
}

export const TrendingAlerts: React.FC<TrendingAlertsProps> = ({ trendingClaims, onSelectClaim }) => {
  if (!trendingClaims || trendingClaims.length === 0) return null;

  return (
    <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-5 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-950 flex items-center gap-2">
              ⚠️ Trending Misinformation Alerts
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white uppercase tracking-wider">
                Urgent
              </span>
            </h2>
            <p className="text-xs text-red-800">
              High-velocity viral rumors currently spreading across messaging channels and social media.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100/80 px-3 py-1.5 rounded-lg border border-red-200 self-start sm:self-auto">
          <Zap className="w-3.5 h-3.5 text-red-600" />
          Top {trendingClaims.length} High-Risk Falsehoods
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {trendingClaims.map((claim, idx) => (
          <div
            key={claim.claimId}
            id={`trending-card-${idx}`}
            onClick={() => onSelectClaim(claim)}
            className="group cursor-pointer bg-white rounded-xl p-4 border border-red-200 hover:border-red-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Warning Banner */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white uppercase tracking-wider">
                  <ShieldAlert className="w-3 h-3" />
                  Marked False
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                  <TrendingUp className="w-3 h-3 text-red-600" />
                  {claim.spreadRate || "High Velocity"}
                </span>
              </div>

              <h3 className="font-bold text-sm text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug">
                {claim.title}
              </h3>

              <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
                {claim.description}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-red-600">
                ⚠️ Spreading fast • Marked FALSE
              </span>
              <span className="font-semibold text-gray-700 group-hover:text-red-600 flex items-center gap-1 transition-colors">
                Debunk <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
