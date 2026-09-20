import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Claim } from "../types";

interface CrisisMapProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onSwitchToFeed?: () => void;
}

export const CrisisMap: React.FC<CrisisMapProps> = ({ claims, onSelectClaim, onSwitchToFeed }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map instance if container was destroyed or re-mounted
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        // ignore
      }
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    }

    // Initialize fresh Leaflet Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([37.0902, -95.7129], 4);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Force layout recalculation after mounting
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      try {
        map.remove();
      } catch (e) {
        // ignore
      }
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update markers whenever claims change or map instance is available
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    // Fallback coordinates for key crisis zones if claim doesn't have exact lat/lng
    const fallbackCoords: Record<string, [number, number]> = {
      Wildfire: [34.0522, -118.2437],
      Flood: [29.7604, -95.3698],
      Hurricane: [25.7617, -80.1918],
      Earthquake: [37.7749, -122.4194],
      Pandemic: [40.7128, -74.006],
      Industrial: [41.8781, -87.6298],
      Other: [38.9072, -77.0369],
    };

    claims.forEach((claim, index) => {
      let lat = claim.latitude;
      let lng = claim.longitude;

      if (lat == null || lng == null) {
        const base = fallbackCoords[claim.crisisType] || [37.0902, -95.7129];
        // Jitter deterministically so overlapping pins don't stack directly on top
        const angle = (index * 137.5 * Math.PI) / 180;
        const radius = 0.4 + (index % 5) * 0.35;
        lat = base[0] + Math.cos(angle) * radius;
        lng = base[1] + Math.sin(angle) * radius;
      }

      const markerColor =
        claim.credibilityBadge === "Verified"
          ? "#059669"
          : claim.credibilityBadge === "False"
          ? "#DC2626"
          : "#D97706";

      const iconHtml = `
        <div style="
          background-color: ${markerColor};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        ">
          ${claim.credibilityBadge === "Verified" ? "✓" : claim.credibilityBadge === "False" ? "✕" : "?"}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-leaflet-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = document.createElement("div");
      popupContent.className = "p-1 font-sans text-xs space-y-1.5 max-w-[240px]";
      popupContent.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:4px; margin-bottom:4px;">
          <span style="background:${markerColor}; color:white; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px;">
            ${claim.credibilityBadge.toUpperCase()}
          </span>
          <span style="color:#666; font-size:10px; font-weight:600;">${claim.crisisType}</span>
        </div>
        <div style="font-weight:bold; color:#111; font-size:12px; line-height:1.35; margin-bottom:4px;">
          ${claim.title.replace(/"/g, '&quot;')}
        </div>
        <div style="color:#555; font-size:11px; margin-bottom:6px;">
          📍 ${claim.location || "Active Emergency Zone"}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #eee; padding-top:6px;">
          <span style="font-size:10px; color:#444;">👍 ${claim.helpfulVotes} | ⚠️ ${claim.misleadingVotes}</span>
          <button id="map-claim-${claim.claimId}" style="background:#dc2626; color:white; border:none; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
            Examine Claim
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("popupopen", () => {
        const btn = document.getElementById(`map-claim-${claim.claimId}`);
        if (btn) {
          btn.onclick = () => onSelectClaim(claim);
        }
      });

      markersLayer.addLayer(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 12 });
      } catch (err) {
        // Fallback
      }
    }
  }, [claims, onSelectClaim]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8 animate-in fade-in duration-300">
      <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
              Live Geospatial Misinformation &amp; Ground-Truth Map
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time geospatial plotting of active incident reports. Click any pin to inspect the debunk or verify.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Verified Truth
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Marked False / Hoax
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Under Investigation
          </span>
          {onSwitchToFeed && (
            <button
              onClick={onSwitchToFeed}
              className="ml-auto md:ml-2 px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              Back to List Feed
            </button>
          )}
        </div>
      </div>

      <div
        id="crisis-map-container"
        ref={mapContainerRef}
        className="w-full h-[540px] z-10 bg-gray-100"
      />
    </div>
  );
};
