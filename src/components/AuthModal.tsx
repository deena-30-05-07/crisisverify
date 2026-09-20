import React, { useState } from "react";
import { X, User as UserIcon, ShieldAlert, LogIn, UserPlus, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { User } from "../types";
import { loginUser, signupUser, guestLogin } from "../services/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<"guest" | "signin" | "signup">("guest");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await guestLogin();
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to start anonymous session");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username && !email) {
      setError("Please enter your username or email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser({ email: email || undefined, username: username || undefined });
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Try guest login or signing up.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError("Please choose a username");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await signupUser({ username, email: email || undefined });
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to register account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600 text-white">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">CrisisVerify Responder Access</h3>
              <p className="text-xs text-gray-400">Emergency identity &amp; community trust</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold">
          <button
            onClick={() => {
              setTab("guest");
              setError(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              tab === "guest"
                ? "border-red-600 text-red-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            ⚡ Quick Guest
          </button>
          <button
            onClick={() => {
              setTab("signin");
              setError(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              tab === "signin"
                ? "border-red-600 text-red-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab("signup");
              setError(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              tab === "signup"
                ? "border-red-600 text-red-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            New Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === "guest" && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Emergency Anonymous Mode</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  During an active disaster, reporting and fact-checking should have zero friction. Instant access without email or password.
                </p>
              </div>

              <button
                id="guest-signin-btn"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 disabled:opacity-50 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserIcon className="w-4 h-4" />}
                Continue as Anonymous Responder
              </button>

              <div className="text-[11px] text-gray-400">
                You can vote, report, and verify claims right away.
              </div>
            </div>
          )}

          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Username or Email
                </label>
                <input
                  id="auth-login-username"
                  type="text"
                  required
                  placeholder="e.g. SarahM_CitizenReporter"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:border-red-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  id="auth-login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:border-red-500 outline-hidden"
                />
              </div>

              <button
                id="auth-submit-login-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Sign In
              </button>
            </form>
          )}

          {tab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="auth-signup-username"
                  type="text"
                  required
                  placeholder="e.g. FieldNurse_Carlos"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:border-red-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email (Optional)
                </label>
                <input
                  id="auth-signup-email"
                  type="email"
                  placeholder="carlos@relief.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:border-red-500 outline-hidden"
                />
              </div>

              <button
                id="auth-submit-signup-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 disabled:opacity-50 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create Responder Profile
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
