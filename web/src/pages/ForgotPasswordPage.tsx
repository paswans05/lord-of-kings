import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Key,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { sqliteDb } from "../db";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>("admin");
  const [recoveryInput, setRecoveryInput] = useState<string>("DRAVIDA2026");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword.trim()) {
      setErrorMsg("Please enter a new password.");
      return;
    }

    if (newPassword.trim().length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await sqliteDb.resetAdminPasswordWithRecovery(recoveryInput, newPassword);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      console.error("[ForgotPassword] Reset failed:", err);
      setErrorMsg("Failed to reset password in SQLite database. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-root fixed inset-0 flex items-center justify-center bg-[#05060a] p-4 select-none overflow-y-auto">
      {/* Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

      <div className="mc-slate mc-goldleaf relative w-full max-w-md p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-[#0c0e15]/95 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white font-semibold transition-colors"
          >
            <ArrowLeft size={14} /> Back to /admin Login
          </Link>
          <span className="text-[0.6rem] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
            PASSWORD RECOVERY
          </span>
        </div>

        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 border border-amber-400 flex items-center justify-center text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] mb-3">
            <Key size={28} />
          </div>
          <p className="mc-display text-[0.62rem] tracking-[0.4em] text-[#c084fc] font-bold">DRAVIDA 3D CHESS</p>
          <h1 className="mc-display text-2xl font-extrabold text-white mt-0.5">Change Admin Password</h1>
          <p className="text-xs text-[#a5b9e0] mt-1">
            Reset and update your admin password directly in the SQLite database.
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>Password Saved to SQLite DB!</span>
            </div>
            <p className="leading-relaxed">{successMsg}</p>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="mc-btn mc-btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
            >
              <span>Go to /admin Login Page</span>
              <ArrowLeft size={14} className="rotate-180" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold animate-fade-in">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="mc-display text-[0.62rem] tracking-[0.2em] text-[#c084fc] block mb-1 font-bold uppercase">
                Admin Username
              </label>
              <div className="relative flex items-center">
                <User size={15} className="absolute left-3 text-[#c084fc]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="mc-chip w-full pl-9 pr-3 py-2 text-xs font-bold text-white outline-none focus:border-[#c084fc] rounded-xl bg-black/40 border border-white/15"
                />
              </div>
            </div>

            <div>
              <label className="mc-display text-[0.62rem] tracking-[0.2em] text-[#c084fc] block mb-1 font-bold uppercase">
                Recovery Key or Email
              </label>
              <div className="relative flex items-center">
                <HelpCircle size={15} className="absolute left-3 text-[#c084fc]" />
                <input
                  type="text"
                  required
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value)}
                  placeholder="DRAVIDA2026 or admin@dravidachess.com"
                  className="mc-chip w-full pl-9 pr-3 py-2 text-xs font-bold text-white outline-none focus:border-[#c084fc] rounded-xl bg-black/40 border border-white/15"
                />
              </div>
              <p className="text-[0.6rem] text-white/50 mt-1 italic">
                System Default Recovery Key: <span className="text-amber-300 font-mono font-bold">DRAVIDA2026</span>
              </p>
            </div>

            <div>
              <label className="mc-display text-[0.62rem] tracking-[0.2em] text-[#c084fc] block mb-1 font-bold uppercase">
                New Admin Password
              </label>
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3 text-[#c084fc]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="mc-chip w-full pl-9 pr-9 py-2 text-xs font-bold text-white outline-none focus:border-[#c084fc] rounded-xl bg-black/40 border border-white/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mc-display text-[0.62rem] tracking-[0.2em] text-[#c084fc] block mb-1 font-bold uppercase">
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3 text-[#c084fc]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  className="mc-chip w-full pl-9 pr-3 py-2 text-xs font-bold text-white outline-none focus:border-[#c084fc] rounded-xl bg-black/40 border border-white/15"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mc-btn mc-btn-primary w-full py-3 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              <Sparkles size={15} />
              <span>{loading ? "Updating SQLite DB..." : "Reset & Save Password in SQLite DB"}</span>
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-5 pt-3 border-t border-white/10 text-center">
          <Link to="/admin" className="text-xs text-purple-300 hover:underline font-semibold">
            Remembered password? Return to /admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
