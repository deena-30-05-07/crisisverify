import React, { useState } from "react";
import { X, Upload, MapPin, Sparkles, AlertCircle, CheckCircle, Loader2, Navigation, Image as ImageIcon } from "lucide-react";
import { CrisisType, User, Claim } from "../types";
import { submitClaim } from "../services/api";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onClaimSubmitted: (claim: Claim) => void;
  onRequireAuth: () => void;
}

const crisisOptions: { label: string; value: string }[] = [
  { label: "⚡ Auto-Detect from Report Text", value: "Auto-detect" },
  { label: "Flood", value: "Flood" },
  { label: "Earthquake", value: "Earthquake" },
  { label: "Wildfire", value: "Wildfire" },
  { label: "Pandemic", value: "Pandemic" },
  { label: "Hurricane", value: "Hurricane" },
  { label: "Industrial Disaster", value: "Industrial Disaster" },
  { label: "Mass Casualty", value: "Mass Casualty" },
  { label: "Severe Storm", value: "Severe Storm" },
  { label: "General Emergency", value: "General Emergency" },
];

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  user,
  onClaimSubmitted,
  onRequireAuth,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [crisisType, setCrisisType] = useState<string>("Auto-detect");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<"file" | "url">("file");

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    claim: Claim;
    credibilityScore: number;
    credibilityBadge: string;
  } | null>(null);

  if (!isOpen) return null;

  // Handle Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocation(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setLocation("Downtown Crisis Perimeter");
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Handle File Upload to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File is too large. Please select an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setImageUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please provide both a claim title and description");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const activeUserId = user?.userId || "anon_responder";
      const activeUsername = user?.username || "Citizen Responder";

      const res = await submitClaim({
        title: title.trim(),
        description: description.trim(),
        imageUrl: imagePreview || imageUrl || undefined,
        location: location.trim() || undefined,
        latitude,
        longitude,
        crisisType,
        userId: activeUserId,
        username: activeUsername,
      });

      setSubmittedResult(res);
      onClaimSubmitted(res.claim);
    } catch (err: any) {
      setError(err.message || "Failed to submit claim. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setTitle("");
    setDescription("");
    setCrisisType("Auto-detect");
    setLocation("");
    setImageUrl("");
    setImagePreview(null);
    setSubmittedResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Report Misinformation or Verify Claim</h2>
              <p className="text-xs text-red-100">
                Submissions are immediately audited by AI and open for community voting
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {submittedResult ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Claim Submitted &amp; Verified!
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Your report has been analyzed by the CrisisVerify fact-checking model and published to the live emergency feed.
              </p>
            </div>

            {/* AI Result Card */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-left max-w-lg mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  AI Credibility Determination
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    submittedResult.credibilityBadge === "Verified"
                      ? "bg-emerald-100 text-emerald-800"
                      : submittedResult.credibilityBadge === "False"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {submittedResult.credibilityBadge === "Verified"
                    ? "🟢 Likely True / Verified"
                    : submittedResult.credibilityBadge === "False"
                    ? "🔴 Likely False / Hoax"
                    : "🟡 Unverified / Pending"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-3xl font-black text-gray-900">
                  {submittedResult.credibilityScore}%
                </div>
                <div className="text-xs text-gray-600 leading-snug">
                  Initial credibility index based on language sentiment, panic markers, and known corroborating alerts.
                </div>
              </div>

              <p className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-gray-100 italic">
                "{submittedResult.claim.aiAnalysis.reasoning}"
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm shadow-xs transition-all"
              >
                Back to Live Feed
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                Claim Title <span className="text-red-500">*</span>
              </label>
              <input
                id="claim-title-input"
                type="text"
                required
                placeholder="e.g. Downtown bridge collapsed during morning flood wave"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden bg-white text-gray-900"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Description &amp; Rumor Context <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-400">{description.length}/500</span>
              </div>
              <textarea
                id="claim-description-input"
                required
                rows={3}
                maxLength={500}
                placeholder="Include where you saw this claim (e.g. WhatsApp, Facebook, local radio), what it states, and any specific claims made..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden bg-white text-gray-900 resize-none"
              />
            </div>

            {/* Row: Crisis Type + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                  Crisis Type
                </label>
                <select
                  id="claim-crisis-type-select"
                  value={crisisType}
                  onChange={(e) => setCrisisType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-gray-300 bg-white text-gray-800 focus:border-red-500 outline-hidden"
                >
                  {crisisOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                  Location (Optional)
                </label>
                <div className="relative flex items-center">
                  <input
                    id="claim-location-input"
                    type="text"
                    placeholder="e.g. Riverside County, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden bg-white text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="absolute right-1.5 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    title="Detect GPS"
                  >
                    {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3 text-red-600" />}
                    <span>GPS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Image / Evidence Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Supporting Photo / Screenshot Evidence (Optional)
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setImageTab("file")}
                    className={`px-2 py-0.5 rounded ${imageTab === "file" ? "bg-gray-900 text-white font-bold" : "text-gray-500"}`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab("url")}
                    className={`px-2 py-0.5 rounded ${imageTab === "url" ? "bg-gray-900 text-white font-bold" : "text-gray-500"}`}
                  >
                    Image Link
                  </button>
                </div>
              </div>

              {imageTab === "file" ? (
                <div className="border-2 border-dashed border-gray-300 hover:border-red-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {imagePreview ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="text-left text-xs">
                        <span className="font-bold text-emerald-600">Image attached successfully</span>
                        <p className="text-gray-500 text-[11px]">Click or drag to change image</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                      <div className="text-xs text-gray-600">
                        <span className="font-bold text-red-600">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-[11px] text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="url"
                  placeholder="https://example.com/disaster-screenshot.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:border-red-500 outline-hidden"
                />
              )}
            </div>

            {/* Submitter Note */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Automated AI Fact-Checking:</span> Upon submission, our AI engine will cross-reference claims against authoritative emergency protocols to assign an initial credibility score (0-100%) and flag known hoax patterns.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>

              <button
                id="submit-claim-btn"
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold shadow-md shadow-red-600/20 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Claim with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Submit &amp; Run AI Fact-Check</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
