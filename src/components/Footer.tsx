import React from "react";
import { ShieldAlert, PhoneCall, HeartHandshake, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16 text-gray-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="font-black text-gray-900 text-base">
                Crisis<span className="text-red-600">Verify</span>
              </span>
            </div>
            <p className="text-gray-500 max-w-sm leading-relaxed">
              Real-time misinformation detector and community fact-checking hub for active emergencies. Powered by instant AI credibility reasoning, official dispatch checks, and crowdsourced field observations.
            </p>
            <div className="flex items-center gap-2 text-red-600 font-semibold text-xs">
              <HeartHandshake className="w-4 h-4" />
              <span>Dedicated to rapid emergency truth and public safety.</span>
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div>
            <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-red-600" />
              Emergency Helplines
            </h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <span className="font-semibold text-gray-800">Immediate Danger:</span>{" "}
                <span className="text-red-600 font-bold">911</span> (US) / <span className="text-red-600 font-bold">112</span> (EU)
              </li>
              <li>
                <span className="font-semibold text-gray-800">FEMA Disaster Assistance:</span>{" "}
                <span>1-800-621-3362</span>
              </li>
              <li>
                <span className="font-semibold text-gray-800">Red Cross Emergency:</span>{" "}
                <span>1-800-733-2767</span>
              </li>
              <li>
                <span className="font-semibold text-gray-800">Disaster Distress Helpline:</span>{" "}
                <span>1-800-985-5990</span>
              </li>
            </ul>
          </div>

          {/* Verification Protocol */}
          <div>
            <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3">
              Consensus Protocols
            </h4>
            <ul className="space-y-2 text-gray-600">
              <li>🟢 <strong>Verified:</strong> 60%+ Helpful consensus + AI verification</li>
              <li>🔴 <strong>Marked False:</strong> 60%+ Misleading consensus + AI flags</li>
              <li>🟡 <strong>Unverified:</strong> Under investigation or split consensus</li>
              <li>⚡ <strong>Response SLA:</strong> &lt; 2.5s automated fact-check</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-400">
          <p>© {new Date().getFullYear()} CrisisVerify Emergency Misinformation Network. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-600 cursor-pointer">Verification Methodology</span>
            <span>•</span>
            <span className="hover:text-gray-600 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
