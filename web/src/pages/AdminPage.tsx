import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  CreditCard,
  BarChart3,
  Database,
  Search,
  DollarSign,
  Sparkles,
  Lock,
  Plus,
  RefreshCw,
  Trophy,
  LogOut,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Key,
  CheckCircle2,
  AlertCircle,
  Crown,
} from "lucide-react";
import { sqliteDb, UserProfile, PaymentRecord, MatchRecord } from "../db";

export default function AdminPage() {
  const navigate = useNavigate();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem("kg_admin_authed") === "true";
    }
    return false;
  });

  const [usernameInput, setUsernameInput] = useState<string>("admin");
  const [passwordInput, setPasswordInput] = useState<string>("admin123");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin Dashboard State
  const [activeTab, setActiveTab] = useState<"users" | "stats" | "payments" | "sql">("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM payments ORDER BY timestamp DESC;");
  const [sqlResults, setSqlResults] = useState<unknown[][] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      void loadAdminData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      const isValid = await sqliteDb.verifyAdminLogin(usernameInput, passwordInput);
      if (isValid) {
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("kg_admin_authed", "true");
        }
      } else {
        setAuthError("Invalid admin username or password. Use 'Forgot Password?' to reset.");
      }
    } catch (err) {
      console.error("[AdminPage] Login error:", err);
      setAuthError("Error verifying credentials in SQLite DB.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("kg_admin_authed");
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const overview = await sqliteDb.getAdminOverview();
      setUsers(overview.users);
      setPayments(overview.payments);
      setMatches(overview.recentMatches);
    } catch (err) {
      console.error("[Admin] Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSql = async () => {
    setSqlError(null);
    setSqlResults(null);
    try {
      const res = await sqliteDb.executeSql(sqlQuery);
      setSqlResults(res);
    } catch (err: unknown) {
      setSqlError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSimulatePayment = async () => {
    const sampleNames = ["Commander Vikram", "Warlord Suryadev", "Emperor Alexander", "Knight Rajan"];
    const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const isPrivate = Math.random() > 0.5;
    const amount = isPrivate ? 25 : 10;
    const purpose = isPrivate
      ? "Secret Private Room Pass (₹25)"
      : "Voice Chat & Room Text Pass (₹10)";

    await sqliteDb.recordPayment({
      id: `pay_admin_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userUuid: "",
      playerName: name,
      email: `${name.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
      amount,
      currency: "INR",
      purpose,
      status: "SUCCESS",
      gateway: "Razorpay Sandbox",
    });

    await loadAdminData();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.uuid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = payments.reduce((sum, p) => sum + (p.status === "SUCCESS" ? p.amount : 0), 0);

  // ------------------------------------------------------------- 1. LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="mc-root fixed inset-0 flex items-center justify-center bg-[#05060a] p-4 select-none">
        {/* Ambient Glow Effects */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        <div className="mc-slate mc-goldleaf relative w-full max-w-md p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-[#0c0e15]/95 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
          {/* Header Link */}
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white font-semibold transition-colors"
            >
              <ArrowLeft size={14} /> Back to Game Realm
            </Link>
            <span className="text-[0.6rem] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
              ADMIN PORTAL
            </span>
          </div>

          {/* Title & Icon */}
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400 flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] mb-3">
              <ShieldCheck size={30} />
            </div>
            <p className="mc-display text-[0.62rem] tracking-[0.4em] text-[#c084fc] font-bold">DRAVIDA 3D CHESS</p>
            <h1 className="mc-display text-2xl font-extrabold text-white mt-0.5">Admin Security Login</h1>
            <p className="text-xs text-[#a5b9e0] mt-1">Enter your administrative credentials to access system analytics & database controls.</p>
          </div>

          {/* Error Alert */}
          {authError && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold animate-fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mc-display text-[0.62rem] tracking-[0.2em] text-[#c084fc] block mb-1 font-bold uppercase">
                Admin Username
              </label>
              <div className="relative flex items-center">
                <User size={15} className="absolute left-3 text-[#c084fc]" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter admin username..."
                  className="mc-chip w-full pl-9 pr-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#c084fc] rounded-xl bg-black/40 border border-white/15"
                />
              </div>
            </div>

            <div>
              <label className="mc-display text-[0.62rem] tracking-[0.2em] text-[#c084fc] block mb-1 font-bold uppercase">
                Admin Password
              </label>
              <div className="relative flex items-center">
                <Key size={15} className="absolute left-3 text-[#c084fc]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password..."
                  className="mc-chip w-full pl-9 pr-9 py-2.5 text-xs font-bold text-white outline-none focus:border-[#c084fc] rounded-xl bg-black/40 border border-white/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-[0.72rem] text-[#c084fc] hover:underline font-semibold">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="mc-btn mc-btn-primary w-full py-3 text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer mt-2"
            >
              <Lock size={15} />
              <span>Sign In to Admin Console</span>
            </button>
          </form>

          {/* Credentials Hint */}
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-[0.68rem] text-white/50">
              Default Admin Credentials: <span className="font-mono text-amber-300 font-bold">admin</span> / <span className="font-mono text-amber-300 font-bold">admin123</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------- 2. AUTHENTICATED DASHBOARD PAGE
  return (
    <div className="mc-root fixed inset-0 flex flex-col bg-[#05060a] text-white select-none overflow-hidden p-2 sm:p-4">
      {/* Top Main Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="mc-display text-base sm:text-lg font-bold text-white">KING&apos;S FALL ADMIN CONSOLE</h1>
              <span className="text-[0.55rem] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> SQLite DB CONNECTED
              </span>
            </div>
            <p className="text-[0.65rem] text-[#a5b9e0]">
              Full Page Management • User Directory, Game Analytics & Razorpay Revenue Logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAdminData}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
            title="Refresh System Data"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-bold text-purple-200 transition-all cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Game Realm</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold text-rose-300 transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 shrink-0">
        <div className="mc-slate p-3 rounded-xl border border-white/10 bg-white/5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[0.58rem] text-white/50 uppercase font-bold tracking-wider">Total Users</p>
            <p className="text-xl font-bold text-white">{users.length}</p>
          </div>
        </div>

        <div className="mc-slate p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[0.58rem] text-emerald-300/70 uppercase font-bold tracking-wider">Total Revenue</p>
            <p className="text-xl font-bold text-emerald-400">₹{totalRevenue}.00</p>
          </div>
        </div>

        <div className="mc-slate p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-[0.58rem] text-amber-300/70 uppercase font-bold tracking-wider">Payments Logged</p>
            <p className="text-xl font-bold text-amber-300">{payments.length}</p>
          </div>
        </div>

        <div className="mc-slate p-3 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-[0.58rem] text-indigo-300/70 uppercase font-bold tracking-wider">Matches Played</p>
            <p className="text-xl font-bold text-indigo-300">{matches.length}</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mc-slate mc-goldleaf flex-1 flex flex-col rounded-2xl border border-white/10 bg-black/40 overflow-hidden min-h-0">
        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/30 px-3 pt-2 gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-purple-500/20 text-purple-300 border-t border-x border-purple-500/40"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Users size={14} />
            Users Directory ({users.length})
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === "stats"
                ? "bg-purple-500/20 text-purple-300 border-t border-x border-purple-500/40"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Trophy size={14} />
            Stats & Leaderboard
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === "payments"
                ? "bg-purple-500/20 text-purple-300 border-t border-x border-purple-500/40"
                : "text-white/60 hover:text-white"
            }`}
          >
            <CreditCard size={14} />
            Payments & Revenue ({payments.length})
          </button>

          <button
            onClick={() => setActiveTab("sql")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === "sql"
                ? "bg-purple-500/20 text-purple-300 border-t border-x border-purple-500/40"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Database size={14} />
            SQLite Console
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 mc-scroll min-h-0">
          
          {/* TAB 1: USERS DIRECTORY */}
          {activeTab === "users" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name or UUID..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/40 border border-white/15 rounded-xl text-white outline-none focus:border-purple-400"
                  />
                </div>
                <p className="text-xs text-white/50 font-mono">Showing {filteredUsers.length} user records</p>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-white/40 border border-dashed border-white/10 rounded-xl">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No user records found matching search query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-white/10 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-purple-300 font-bold uppercase text-[0.6rem] tracking-wider">
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Commander Username</th>
                        <th className="p-2.5">User UUID</th>
                        <th className="p-2.5">Rating ELO</th>
                        <th className="p-2.5">Title</th>
                        <th className="p-2.5">Registered Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-2.5 font-mono text-white/60">#{u.id}</td>
                          <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[0.65rem]">
                              {u.username.charAt(0).toUpperCase()}
                            </span>
                            <span>{u.username}</span>
                          </td>
                          <td className="p-2.5 font-mono text-white/50 text-[0.65rem] truncate max-w-[160px]">{u.uuid}</td>
                          <td className="p-2.5 font-bold text-amber-300">{u.rating || 1200} ELO</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[0.62rem] font-semibold">
                              {u.title || "Commander"}
                            </span>
                          </td>
                          <td className="p-2.5 text-white/60 font-mono text-[0.65rem]">
                            {new Date(u.createdAt).toLocaleDateString()} {new Date(u.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STATS & LEADERBOARD */}
          {activeTab === "stats" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="mc-display text-sm font-bold text-white flex items-center gap-1.5">
                  <Trophy size={16} className="text-amber-400" />
                  <span>Commander Leaderboard & Gameplay Analytics</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mc-slate p-4 rounded-xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Top Ranked Commanders</h4>
                  <div className="space-y-2">
                    {users.slice(0, 5).map((u, i) => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[0.65rem] ${
                            i === 0 ? "bg-amber-500 text-black" : i === 1 ? "bg-slate-300 text-black" : i === 2 ? "bg-amber-700 text-white" : "bg-white/10 text-white/70"
                          }`}>
                            {i + 1}
                          </span>
                          <span className="font-bold text-white">{u.username}</span>
                        </div>
                        <span className="font-bold text-amber-300">{u.rating} ELO</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mc-slate p-4 rounded-xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Recent Matches System Log</h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto mc-scroll pr-1">
                    {matches.length === 0 ? (
                      <p className="text-xs text-white/40 italic">No recent matches recorded.</p>
                    ) : (
                      matches.slice(0, 6).map((m) => (
                        <div key={m.id} className="p-2 rounded-lg bg-white/5 border border-white/10 text-[0.68rem] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white">{m.whitePlayer}</span> vs <span className="font-bold text-white">{m.blackPlayer}</span>
                            <span className="ml-2 text-white/40">({m.movesCount} moves)</span>
                          </div>
                          <span className="text-emerald-400 font-semibold">{m.winner}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS & REVENUE LOGS */}
          {activeTab === "payments" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={14} />
                    <span>Razorpay & Payment Transaction Logs</span>
                  </h3>
                  <p className="text-[0.68rem] text-white/60">
                    Showing all successful revenue transactions stored in SQLite database.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
                >
                  <Plus size={13} /> Add Test Payment Record
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-12 text-white/40 border border-dashed border-white/10 rounded-xl bg-white/5">
                  <CreditCard size={32} className="mx-auto mb-2 opacity-30 text-amber-400" />
                  <p className="text-xs font-semibold text-white/80">No payment transaction records found.</p>
                  <p className="text-[0.65rem] text-white/50 mt-1">
                    Payments made for Private Rooms (₹25) or Voice Chat (₹10) will be automatically recorded here!
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="mt-3 px-3 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-lg hover:bg-purple-500/30 cursor-pointer"
                  >
                    Simulate Test Payment
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-white/10 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-emerald-300 font-bold uppercase text-[0.6rem] tracking-wider">
                        <th className="p-2.5">Transaction ID</th>
                        <th className="p-2.5">Commander Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Purpose / Pass</th>
                        <th className="p-2.5">Amount (INR)</th>
                        <th className="p-2.5">Gateway</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-2.5 font-mono text-white/70 text-[0.65rem]">{p.id}</td>
                          <td className="p-2.5 font-bold text-white">{p.playerName}</td>
                          <td className="p-2.5 text-white/60 font-mono text-[0.65rem]">{p.email || "N/A"}</td>
                          <td className="p-2.5 text-purple-200">{p.purpose}</td>
                          <td className="p-2.5 font-bold text-emerald-400">₹{p.amount}.00</td>
                          <td className="p-2.5 text-white/60 text-[0.65rem]">{p.gateway}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[0.6rem] font-bold flex items-center gap-1 w-fit">
                              <CheckCircle2 size={10} /> {p.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-white/60 font-mono text-[0.65rem]">
                            {new Date(p.timestamp).toLocaleDateString()} {new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SQLITE LIVE CONSOLE */}
          {activeTab === "sql" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-purple-300">Run Admin Raw SQL Query on SQLite DB:</label>
                <button
                  onClick={handleRunSql}
                  className="flex items-center gap-1.5 px-3 py-1 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
                >
                  <Sparkles size={13} /> Run SQL Query
                </button>
              </div>

              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-purple-500/40 text-purple-100 font-mono text-xs focus:outline-none focus:border-purple-400"
              />

              {sqlError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                  SQL Error: {sqlError}
                </div>
              )}

              {sqlResults && (
                <div className="overflow-x-auto max-h-64 mc-scroll border border-white/10 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <tbody>
                      {sqlResults.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-white/5 hover:bg-white/5">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 border-r border-white/5 text-purple-100/90">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
