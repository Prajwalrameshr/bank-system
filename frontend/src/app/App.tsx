import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import confetti from "canvas-confetti";
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, Wallet, User, ShieldCheck,
  LogOut, Bell, Search, Eye, EyeOff, ArrowDownLeft, CheckCircle2, XCircle,
  Clock, Download, Sun, Moon, ChevronDown, Filter, Check, Loader2,
  DollarSign, Users, ChevronLeft, ChevronRight, Snowflake, FileText,
  Camera, Phone, Globe, MapPin, Briefcase, AlertTriangle, TrendingUp,
  TrendingDown, Upload, Mail, Building2, Hash, Lock, RefreshCw,
} from "lucide-react";

// Import actual backend & mock database client APIs
import {
  api,
  getAppMode,
  setAppMode,
  getCurrentUser,
  setCurrentUser,
  logoutUser,
  setAuthToken,
} from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "login" | "register" | "dashboard" | "accounts" | "deposit" | "transfer" | "profile" | "admin";

// ─── Utilities ────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(Math.abs(n));
}
function initials(name: string): string {
  if (!name) return "AC";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() || "pending";
  const styles: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    approved:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending:   "bg-amber-50 text-amber-700 border-amber-200",
    failed:    "bg-red-50 text-red-600 border-red-200",
    rejected:  "bg-red-50 text-red-600 border-red-200",
    closed:    "bg-slate-100 text-slate-500 border-slate-300",
  };
  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="w-3 h-3" />,
    approved:  <CheckCircle2 className="w-3 h-3" />,
    active:    <CheckCircle2 className="w-3 h-3" />,
    pending:   <Clock className="w-3 h-3" />,
    failed:    <XCircle className="w-3 h-3" />,
    rejected:  <XCircle className="w-3 h-3" />,
    closed:    <XCircle className="w-3 h-3" />,
  };
  const cls = styles[normalized] ?? "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {icons[normalized]}
      {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "Pending"}
    </span>
  );
}

function Sparkline({ data, color, gid }: { data: { v: number }[]; color: string; gid: string }) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gid})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DevModeToggle() {
  const mode = getAppMode();
  const isReal = mode === "real";

  const toggleMode = () => {
    const newMode = isReal ? "mock" : "real";
    if (newMode === "real") {
      const token = prompt("Enter Keycloak Bearer Token (optional for mock security bypass):");
      if (token !== null) {
        setAuthToken(token);
      }
    }
    setAppMode(newMode);
  };

  return (
    <div
      className="fixed bottom-6 right-6 bg-slate-900 border-2 border-blue-500 rounded-full px-4 py-2 flex items-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.3)] z-50 cursor-pointer hover:scale-105 transition-all duration-200"
      onClick={toggleMode}
      title="Click to toggle between Mock Database and Real Gateway APIs"
    >
      <span className={`w-2.5 h-2.5 rounded-full ${isReal ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-blue-400 shadow-[0_0_8px_#60a5fa]"}`}></span>
      <span className="text-xs font-bold tracking-wider text-gray-200 uppercase">
        {isReal ? "REAL API GATEWAY" : "MOCK DATABASE"}
      </span>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onRegister }: { onLogin: (email: string) => Promise<void>; onRegister: () => void }) {
  const [email, setEmail] = useState("adamsanadi1234@gmail.com");
  const [password, setPassword] = useState("any-password");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onLogin(email);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F7F8FA" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 45%, #4338ca 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute -bottom-20 left-1/3 w-64 h-64 rounded-full" style={{ background: "rgba(99,102,241,0.25)" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Apex Bank</span>
        </div>

        {/* Card illustration */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-80 rounded-3xl p-7 shadow-2xl relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(12px)" }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(191,219,254,0.8)" }}>Apex Bank</p>
                <p className="text-white font-bold text-base">Checking Account</p>
              </div>
              <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
                <circle cx="16" cy="14" r="14" fill="rgba(255,255,255,0.35)" />
                <circle cx="28" cy="14" r="14" fill="rgba(255,255,255,0.2)" />
              </svg>
            </div>
            <div className="w-10 h-7 rounded-md mb-5 border flex items-center justify-center" style={{ background: "rgba(251,191,36,0.75)", borderColor: "rgba(253,230,138,0.5)" }}>
              <div className="w-6 h-4 rounded-sm" style={{ background: "rgba(253,230,138,0.45)", border: "1px solid rgba(253,230,138,0.3)" }} />
            </div>
            <p className="text-sm tracking-widest mb-5 font-mono" style={{ color: "rgba(255,255,255,0.75)" }}>•••• •••• •••• 0001</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "rgba(147,197,253,0.6)" }}>Card Holder</p>
                <p className="text-white font-semibold text-sm">Adam Sanadi</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "rgba(147,197,253,0.6)" }}>Expires</p>
                <p className="text-white font-semibold text-sm">12/30</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10">
          <h2 className="text-white text-2xl font-bold mb-2">Banking built for the microservices era</h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(147,197,253,0.75)" }}>Manage profiles, transfer funds, and track balances dynamically.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Apex Bank</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
            <p className="text-slate-500">Sign in to your banking dashboard credentials.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm flex items-start gap-2.5 mb-5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-blue-500 transition-all text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-blue-500 transition-all text-sm"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${remember ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"}`}
              >
                {remember && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className="text-sm text-slate-600">Remember credentials</span>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              style={{ boxShadow: "0 8px 24px rgba(29,78,216,0.3)" }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...</>
              ) : "Sign In"}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-7">
            {"Don't have an account? "}
            <button onClick={onRegister} className="text-blue-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer">Register Now</button>
          </p>
        </motion.div>
      </div>
      <DevModeToggle />
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────
function RegisterPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", terms: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function strength(p: string): number {
    if (!p) return 0;
    return [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^a-zA-Z0-9]/.test(p)].filter(Boolean).length;
  }
  const s = strength(form.password);
  const sLabel = ["", "Weak", "Fair", "Good", "Strong"][s];
  const sColor = ["", "#ef4444", "#f59e0b", "#eab308", "#10b981"][s];

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.terms) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.registerUser({
        emailId: form.email,
        contactNumber: form.phone,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to register profile");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "#F7F8FA" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-100 p-10 text-center max-w-md w-full shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</h3>
          <p className="text-slate-500 text-sm mb-6">
            Your KYC profile has been saved. Please contact an admin or go to the **Admin Approvals** panel to approve profile **{form.email}** to unlock logins.
          </p>
          <button onClick={onBack} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all cursor-pointer">
            Back to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "#F7F8FA" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center gap-2.5 mb-7 justify-center">
          <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">Apex Bank</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-8" style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.06)" }}>
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Create your account</h1>
            <p className="text-slate-500 text-sm">Join managing your microservices ledger accounts.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3.5 text-sm flex items-start gap-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name</label>
                <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" placeholder="Adam" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
                <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" placeholder="Sanadi" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" placeholder="+91 85471 59267" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" placeholder="Create password" />
              </div>
              {form.password && (
                <div className="mt-2.5">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= s ? sColor : "#E2E8F0" }} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500" style={{ color: s > 0 ? sColor : undefined }}>{sLabel} password</p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <button type="button" onClick={() => setForm({ ...form, terms: !form.terms })}
                className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 transition-all shrink-0 ${form.terms ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"}`}>
                {form.terms && <Check className="w-3 h-3 text-white" />}
              </button>
              <p className="text-sm text-slate-600">
                I agree to the Terms of Service and Privacy Policy.
              </p>
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{ boxShadow: "0 8px 24px rgba(29,78,216,0.3)" }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating profile...</> : "Create Account"}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <button onClick={onBack} className="text-blue-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer">Sign In</button>
          </p>
        </div>
      </motion.div>
      <DevModeToggle />
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard",          icon: LayoutDashboard },
  { id: "accounts",  label: "Accounts",            icon: CreditCard },
  { id: "transfer",  label: "Transfer Funds",       icon: ArrowLeftRight },
  { id: "deposit",   label: "Deposit / Withdraw",   icon: Wallet },
  { id: "profile",   label: "Edit Profile",         icon: User },
  { id: "admin",     label: "Admin Approvals",      icon: ShieldCheck },
];

function Sidebar({ page, onNavigate, collapsed, onToggle, user, onLogout }: {
  page: Page; onNavigate: (p: Page) => void; collapsed: boolean; onToggle: () => void; user: any; onLogout: () => void;
}) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 70 : 240 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-screen bg-white border-r border-slate-100 flex flex-col shrink-0 overflow-hidden relative z-20"
      style={{ boxShadow: "1px 0 0 rgba(15,23,42,0.05)" }}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-slate-100 gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="font-bold text-slate-900 text-lg whitespace-nowrap"
            >
              Apex Bank
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id as Page)}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium relative cursor-pointer ${
                active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-blue-600" : ""}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {active && (
                <motion.span
                  layoutId="nav-dot"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Logout + collapse toggle */}
      <div className="px-2 pb-3 border-t border-slate-100 pt-2 space-y-0.5 shrink-0">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all cursor-pointer border-0 bg-transparent">
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="whitespace-nowrap">
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button onClick={onToggle} className="w-full flex items-center justify-center py-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer border-0 bg-transparent">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard", accounts: "Accounts", transfer: "Transfer Funds",
  deposit: "Deposit & Withdrawal", profile: "Edit Profile", admin: "Admin Approvals",
};

function Header({ page, userProfile, darkMode, onToggleDark }: { page: Page; userProfile: any; darkMode: boolean; onToggleDark: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const fullName = userProfile?.userProfile?.firstName 
    ? `${userProfile.userProfile.firstName} ${userProfile.userProfile.lastName || ""}`
    : userProfile?.emailId || "Customer Profile";

  const initialsLabel = userProfile?.userProfile?.firstName
    ? `${userProfile.userProfile.firstName.charAt(0)}${userProfile.userProfile.lastName?.charAt(0) || ""}`
    : "AC";

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-10 shrink-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
          <span className="text-blue-600 font-medium">Apex Bank</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">{PAGE_LABELS[page]}</span>
        </div>
        <h1 className="text-base font-bold text-slate-900 leading-none">{PAGE_LABELS[page]}</h1>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-emerald-700 whitespace-nowrap">All Systems Operational</span>
      </div>

      <button onClick={onToggleDark}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all cursor-pointer">
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all relative cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-100 overflow-hidden z-50 shadow-lg"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">Notifications</span>
              </div>
              {[
                { msg: "KYC profile sync processed successfully", time: "Just now", dot: "#10b981" },
                { msg: "Systems connected & running on live hooks", time: "1 hour ago", dot: "#3b82f6" },
              ].map((n, i) => (
                <div key={i} className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex gap-3 border-b border-slate-50 last:border-0">
                  <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: n.dot }} />
                  <div>
                    <p className="text-sm text-slate-800">{n.msg}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User */}
      <div className="relative">
        <button onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
          className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer bg-transparent">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
            {initialsLabel}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{fullName}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">{userProfile?.status} Profile</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </button>
        <AnimatePresence>
          {userOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-52 bg-white rounded-2xl border border-slate-100 overflow-hidden z-50 shadow-lg"
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-sm text-slate-900">{fullName}</p>
                <p className="text-xs text-slate-400 truncate">{userProfile?.emailId}</p>
              </div>
              <div className="border-t border-slate-100 p-2">
                <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 border-0 bg-transparent cursor-pointer">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function DashboardPage({ dbUser, activeAccount, transactionsList }: { dbUser: any; activeAccount: any; transactionsList: any[] }) {
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Compute total deposits & withdrawals
  const totalDepositsVal = transactionsList
    .filter(t => t.transactionType === "DEPOSIT" || t.transactionType === "TRANSFER_IN")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDebitsVal = transactionsList
    .filter(t => t.transactionType === "WITHDRAWAL" || t.transactionType === "TRANSFER_OUT")
    .reduce((acc, t) => acc + t.amount, 0);

  const mockTrends = [{ v: 10 }, { v: 15 }, { v: 12 }, { v: 18 }, { v: 22 }, { v: 18 }, { v: 25 }];

  const cards = [
    { title: "Available Balance", value: activeAccount ? fmt(activeAccount.availableBalance) : "$0.00", sub: activeAccount ? `Account •••• ${activeAccount.accountNumber.slice(-4)}` : "No active account setup", trend: "Live Balance from ledger", up: true, data: mockTrends, color: "#3b82f6", hero: true },
    { title: "Total Deposits",    value: fmt(totalDepositsVal),  sub: "Lifetime Credits",    trend: "Updated credits", up: true,  data: mockTrends, color: "#10b981", hero: false },
    { title: "Total Debits",      value: fmt(totalDebitsVal),    sub: "Lifetime Debits",     trend: "Updated debits", up: false, data: mockTrends, color: "#ef4444", hero: false },
    { title: "Monthly Savings",   value: activeAccount ? fmt(activeAccount.availableBalance * 0.15) : "$0.00", sub: "Computed index", trend: "Automatic index", up: true, data: mockTrends, color: "#8b5cf6", hero: false },
  ];

  // Map transactions to Recharts visual bars
  const chartData = [
    { name: "Deposits", value: totalDepositsVal, fill: "#3b82f6" },
    { name: "Debits", value: totalDebitsVal, fill: "#f87171" },
    { name: "Balance", value: activeAccount ? activeAccount.availableBalance : 0, fill: "#a78bfa" },
  ];

  return (
    <div className="p-8 space-y-7">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Good day, {dbUser?.userProfile?.firstName || "Customer"} 👋
        </h2>
        <p className="text-slate-500 text-sm mt-1">Financial overview dashboard.</p>
      </div>

      {/* Hero cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={`rounded-2xl p-5 overflow-hidden relative ${c.hero ? "text-white" : "bg-white border border-slate-100"}`}
            style={c.hero ? { background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #4338ca 100%)", boxShadow: "0 12px 36px rgba(29,78,216,0.28)" } : { boxShadow: "0 2px 12px rgba(15,23,42,0.04)" }}
          >
            {c.hero && (
              <>
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
              </>
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.hero ? "text-blue-200" : "text-slate-400"}`}>{c.title}</p>
                {c.hero && (
                  <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-white/60 hover:text-white transition-colors bg-transparent border-0 cursor-pointer">
                    {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <p className={`text-2xl font-bold mb-1 ${c.hero ? "text-white" : "text-slate-900"}`}>
                {c.hero ? (balanceVisible ? c.value : "••••••") : c.value}
              </p>
              <p className={`text-xs mb-3 ${c.hero ? "text-blue-200/70" : "text-slate-400"}`}>{c.sub}</p>
              {!c.hero && <div className="mb-3"><Sparkline data={c.data} color={c.color} gid={`sp-${i}`} /></div>}
              <div className={`flex items-center gap-1 text-xs font-medium ${c.hero ? "text-blue-200" : c.up ? "text-emerald-600" : "text-red-500"}`}>
                {c.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {c.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Bar chart */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">Ledger Ratios</h3>
              <p className="text-sm text-slate-400 mt-0.5">Asset distributions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", fontSize: "12px" }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 flex flex-col shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time update feed</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[220px]">
            {transactionsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No transactions recorded yet.</div>
            ) : (
              transactionsList.map((tx, i) => {
                const isCredit = tx.transactionType === "DEPOSIT" || tx.transactionType === "TRANSFER_IN";
                return (
                  <motion.div
                    key={tx.transactionReference || i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCredit ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-500"}`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{tx.description || "Banking Operation"}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleDateString()} · {tx.transactionReference || "REF"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${isCredit ? "text-emerald-600" : "text-slate-900"}`}>
                        {isCredit ? "+" : "−"}{fmt(tx.amount)}
                      </p>
                      <StatusBadge status="completed" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Accounts Page ────────────────────────────────────────────────────────────
function AccountsPage({ dbUser, activeAccount, transactionsList, onRefresh }: { dbUser: any; activeAccount: any; transactionsList: any[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [acctType, setAcctType] = useState("SAVINGS_ACCOUNT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = transactionsList.filter(
    (tx) => tx.description?.toLowerCase().includes(search.toLowerCase()) || tx.transactionReference?.includes(search)
  );

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.createAccount({
        userId: dbUser.userId,
        accountType: acctType,
      });
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to setup bank account");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAccount = async () => {
    if (!confirm("Are you sure you want to close this account? All remaining funds will be cleared.")) return;
    try {
      await api.closeAccount(activeAccount.accountNumber);
      onRefresh();
    } catch (err: any) {
      alert("Failed to close account: " + err.message);
    }
  };

  return (
    <div className="p-8">
      {!activeAccount ? (
        <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1.5">No Active Account Setup</h3>
          <p className="text-slate-500 text-sm mb-6">You need to setup a Savings or Checking account ledger to start transactions.</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Type</label>
              <select 
                value={acctType} 
                onChange={(e) => setAcctType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all"
              >
                <option value="SAVINGS_ACCOUNT">Savings Account</option>
                <option value="CHECKING_ACCOUNT">Checking Account</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-75 cursor-pointer"
            >
              {loading ? "Allocating Ledger..." : "Create Account"}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-5">
            {/* Glass banking card */}
            <div className="relative rounded-2xl p-7 overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #312e81 100%)", boxShadow: "0 20px 60px rgba(29,78,216,0.3)", aspectRatio: "1.586" }}>
              <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full" style={{ background: "rgba(99,102,241,0.2)" }} />

              <div className="relative flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(147,197,253,0.75)" }}>Apex Bank</p>
                    <p className="text-white font-bold text-base">{activeAccount.accountType.replace("_", " ")}</p>
                  </div>
                  <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
                    <circle cx="16" cy="14" r="14" fill="rgba(255,255,255,0.35)" />
                    <circle cx="28" cy="14" r="14" fill="rgba(255,255,255,0.2)" />
                  </svg>
                </div>

                <div>
                  <div className="w-10 h-7 rounded-md mb-4 flex items-center justify-center" style={{ background: "rgba(251,191,36,0.8)", border: "1px solid rgba(253,230,138,0.5)" }}>
                    <div className="w-6 h-4 rounded-sm" style={{ background: "rgba(253,230,138,0.5)" }} />
                  </div>
                  <p className="font-mono text-sm tracking-[0.2em] mb-5" style={{ color: "rgba(255,255,255,0.8)" }}>
                    •••• •••• •••• {activeAccount.accountNumber.slice(-4)}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "rgba(147,197,253,0.6)" }}>Owner</p>
                      <p className="text-white font-semibold text-sm">
                        {dbUser.userProfile?.firstName} {dbUser.userProfile?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.2)", color: "#6ee7b7" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {activeAccount.accountStatus}
                    </span>
                    <p className="text-white font-bold text-lg">{fmt(activeAccount.availableBalance)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: XCircle, label: "Close Account", cls: "text-red-500 bg-red-50 hover:bg-red-100", action: handleCloseAccount },
                  { icon: Snowflake, label: "Freeze Card", cls: "text-blue-600 bg-blue-50 hover:bg-blue-100", action: () => alert("Card Freeze toggle sent") },
                  { icon: Download, label: "Statement", cls: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100", action: () => window.print() },
                ].map((a) => (
                  <button key={a.label} onClick={a.action} className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all border-0 cursor-pointer ${a.cls}`}>
                    <a.icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center leading-tight">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account details */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Account Details</h3>
              <div className="space-y-0">
                {[
                  { l: "Account Number", v: activeAccount.accountNumber },
                  { l: "Account Status", v: activeAccount.accountStatus },
                  { l: "Account Type", v: activeAccount.accountType.replace("_", " ") },
                  { l: "Currency", v: "USD — US Dollar" },
                  { l: "DB Index Key", v: `KEY-${activeAccount.accountId}` },
                ].map((item) => (
                  <div key={item.l} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400">{item.l}</span>
                    <span className="text-sm text-slate-800 font-medium font-mono">{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Statement */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 flex flex-col shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Account Statement</h3>
                  <p className="text-xs text-slate-400 mt-0.5">All transactions for this account</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or reference..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div className="overflow-auto flex-1 max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-100">
                    {["Date", "Reference", "Description", "Amount", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-slate-400">No records found matching filters.</td>
                    </tr>
                  ) : (
                    filtered.map((tx, idx) => {
                      const isCredit = tx.transactionType === "DEPOSIT" || tx.transactionType === "TRANSFER_IN";
                      return (
                        <tr key={tx.transactionReference || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{new Date(tx.timestamp).toLocaleDateString()}</td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{tx.transactionReference || "REF"}</td>
                          <td className="px-4 py-3.5 text-slate-900 font-medium max-w-[160px] truncate">{tx.description || "Banking Operation"}</td>
                          <td className={`px-4 py-3.5 font-semibold whitespace-nowrap ${isCredit ? "text-emerald-600" : "text-slate-900"}`}>
                            {isCredit ? "+" : "−"}{fmt(tx.amount)}
                          </td>
                          <td className="px-4 py-3.5"><StatusBadge status="completed" /></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Deposit / Withdraw Page ──────────────────────────────────────────────────
function DepositPage({ activeAccount, onRefresh }: { activeAccount: any; onRefresh: () => void }) {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const lastAmount = amount;

  useEffect(() => {
    if (success && tab === "deposit") {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [success]);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    setLoading(true);
    setError("");
    try {
      await api.makeDepositOrWithdrawal({
        accountId: activeAccount.accountNumber,
        transactionType: tab === "deposit" ? "DEPOSIT" : "WITHDRAWAL",
        amount: parseFloat(amount),
        description: memo || `${tab.toUpperCase()} via Web ATM`,
      });
      setSuccess(true);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  if (!activeAccount) {
    return (
      <div className="p-8 text-center max-w-sm mx-auto bg-white border border-slate-100 rounded-2xl shadow-sm">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <h3 className="font-bold text-slate-900 mb-1">Create Account First</h3>
        <p className="text-slate-500 text-sm">You must create a checking/savings account ledger before carrying out ATM actions.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[55vh]">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-100 p-10 text-center max-w-sm w-full shadow-sm">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 220 }}
            className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-emerald-600" />
          </motion.div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Transaction Successful</h3>
          <p className="text-slate-500 text-sm mb-2">{tab === "deposit" ? "Deposit" : "Withdrawal"} of</p>
          <p className="text-3xl font-bold text-slate-900 mb-1">${parseFloat(lastAmount || "0").toFixed(2)}</p>
          <p className="text-slate-400 text-sm mb-7">processed successfully. Funds will reflect within minutes.</p>
          <button onClick={() => { setSuccess(false); setAmount(""); setMemo(""); }}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all cursor-pointer">
            New Transaction
          </button>
        </motion.div>
      </div>
    );
  }

  const parsed = parseFloat(amount);
  const valid = amount && !isNaN(parsed) && parsed > 0;

  return (
    <div className="p-8">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #1e40af, #1d4ed8, #4338ca)", boxShadow: "0 12px 36px rgba(29,78,216,0.28)" }}>
          <p className="text-sm font-medium mb-1" style={{ color: "rgba(147,197,253,0.85)" }}>Available Balance</p>
          <p className="text-3xl font-bold">{fmt(activeAccount.availableBalance)}</p>
          <p className="text-xs mt-1" style={{ color: "rgba(147,197,253,0.65)" }}>Account •••• {activeAccount.accountNumber.slice(-4)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {(["deposit", "withdraw"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border-0 bg-transparent ${tab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
                {t === "deposit" ? "Deposit" : "Withdraw"}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex gap-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTransaction} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xl font-bold focus:outline-none focus:ring-2 focus:border-blue-500 transition-all"
                  placeholder="0.00" required />
              </div>
              <div className="flex gap-2 mt-3">
                {["500", "1000", "2500", "5000"].map((v) => (
                  <button type="button" key={v} onClick={() => setAmount(v)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all cursor-pointer bg-white">
                    ${parseInt(v).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Memo (Optional)</label>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all resize-none"
                placeholder="Add details..." />
            </div>

            {valid && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{tab === "deposit" ? "Deposit" : "Withdrawal"} Amount</span>
                  <span className="font-semibold text-slate-900">${parsed.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Processing Fee</span>
                  <span className="font-medium text-emerald-600">Free</span>
                </div>
              </motion.div>
            )}

            <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={!valid || loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
              style={{ boxShadow: valid ? "0 8px 24px rgba(29,78,216,0.3)" : "none" }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `${tab === "deposit" ? "Deposit" : "Withdraw"} Funds`}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Transfer Page ────────────────────────────────────────────────────────────
function TransferPage({ activeAccount, onRefresh }: { activeAccount: any; onRefresh: () => void }) {
  const [form, setForm] = useState({ acct: "", name: "", amount: "", remarks: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (success) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }
  }, [success]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    setLoading(true);
    setError("");
    try {
      await api.transferFunds({
        fromAccount: activeAccount.accountNumber,
        toAccount: form.acct,
        amount: parseFloat(form.amount),
        description: form.remarks || `Transfer to ${form.acct}`,
      });
      setSuccess(true);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Fund routing transfer failed");
    } finally {
      setLoading(false);
    }
  };

  if (!activeAccount) {
    return (
      <div className="p-8 text-center max-w-sm mx-auto bg-white border border-slate-100 rounded-2xl shadow-sm">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <h3 className="font-bold text-slate-900 mb-1">Create Account First</h3>
        <p className="text-slate-500 text-sm">You must create a checking/savings account ledger before initiating money transfers.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[55vh]">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-100 p-10 text-center max-w-sm w-full shadow-sm">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 220 }}
            className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-emerald-600" />
          </motion.div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Transfer Successful!</h3>
          <p className="text-slate-500 text-sm mb-2">You sent</p>
          <p className="text-3xl font-bold text-slate-900">${parseFloat(form.amount || "0").toFixed(2)}</p>
          <p className="text-slate-400 text-sm my-1">to Account</p>
          <p className="font-semibold text-slate-800 mb-7">{form.acct || "Recipient"}</p>
          <button onClick={() => { setSuccess(false); setForm({ acct: "", name: "", amount: "", remarks: "" }); }}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all cursor-pointer border-0">
            New Transfer
          </button>
        </motion.div>
      </div>
    );
  }

  const parsedAmt = parseFloat(form.amount);
  const valid = !isNaN(parsedAmt) && parsedAmt > 0;
  const fee = valid ? (parsedAmt * 0.005).toFixed(2) : "0.00";
  const total = valid ? (parsedAmt + parseFloat(fee)).toFixed(2) : "0.00";

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleTransfer} className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Form */}
          <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 space-y-5 shadow-sm">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">From</p>
              <div className="flex items-center gap-3 bg-blue-50/70 rounded-xl p-3.5 border border-blue-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                  TX
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Checking Account</p>
                  <p className="text-xs text-slate-500">•••• {activeAccount.accountNumber.slice(-4)} · {fmt(activeAccount.availableBalance)} available</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <ArrowDownLeft className="w-5 h-5 text-slate-300" />
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">To</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Destination Account Number</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required value={form.acct} onChange={(e) => setForm({ ...form, acct: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:border-blue-500 transition-all text-sm"
                      placeholder="Enter 13-digit account number" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xl font-bold focus:outline-none focus:ring-2 focus:border-blue-500 transition-all"
                      placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Remarks</label>
                  <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all"
                    placeholder="What is this transfer for?" />
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Transfer Summary</h3>
              <div className="space-y-3">
                {[
                  { l: "Recipient Account", v: form.acct ? `Account •••• ${form.acct.slice(-4)}` : "—" },
                  { l: "Amount", v: valid ? `$${parsedAmt.toFixed(2)}` : "—" },
                  { l: "Routing Fee (0.5%)", v: `$${fee}` },
                ].map((r) => (
                  <div key={r.l} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{r.l}</span>
                    <span className="font-medium text-slate-900 text-right max-w-[140px] truncate">{r.v}</span>
                  </div>
                ))}
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-900">Total Deducted</span>
                  <span className="text-slate-900">${total}</span>
                </div>
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.98 }} type="submit"
              disabled={!form.acct || !valid || loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
              style={{ boxShadow: valid ? "0 8px 24px rgba(29,78,216,0.3)" : "none" }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : "Confirm Transfer"}
            </motion.button>

            <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">Verify beneficiary account details before executing routing procedures.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Profile / KYC Page ───────────────────────────────────────────────────────
function ProfilePage({ dbUser, onRefresh }: { dbUser: any; onRefresh: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "",
    nationality: "", gender: "Male", marital: "Single",
    occupation: "", address: "",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (dbUser) {
      setForm({
        firstName: dbUser.userProfile?.firstName || "",
        lastName: dbUser.userProfile?.lastName || "",
        phone: dbUser.contactNo || "",
        nationality: dbUser.userProfile?.nationality || "",
        gender: dbUser.userProfile?.gender || "Male",
        marital: dbUser.userProfile?.martialStatus || "Single",
        occupation: dbUser.userProfile?.occupation || "",
        address: dbUser.userProfile?.address || "",
      });
    }
  }, [dbUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.updateUserProfile(dbUser.userId, {
        contactNo: form.phone,
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        martialStatus: form.marital,
        occupation: form.occupation,
        nationality: form.nationality,
        address: form.address,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to update profile details");
    } finally {
      setLoading(false);
    }
  };

  const progress = dbUser?.status === "APPROVED" ? 100 : 75;

  return (
    <div className="p-8 space-y-6">
      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-5 shadow-sm">
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#F1F5F9" strokeWidth="5" />
            <circle cx="28" cy="28" r="22" fill="none" stroke="#1d4ed8" strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress / 100)}`}
              strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900">{progress}%</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900">KYC Profile Status</p>
          <p className="text-sm text-slate-500 mt-0.5">Maintain updated profile metadata to prevent transaction limits.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-700">{dbUser?.status || "PENDING"}</span>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Photo */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-sm">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                {initials(dbUser?.userProfile?.firstName ? `${dbUser.userProfile.firstName} ${dbUser.userProfile.lastName || ""}` : dbUser?.emailId)}
              </div>
            </div>
            <p className="font-semibold text-slate-900">{dbUser?.userProfile?.firstName} {dbUser?.userProfile?.lastName}</p>
            <p className="text-sm text-slate-400 mt-0.5">UID: {dbUser?.userId}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Verification Metadata</h3>
            <div className="space-y-2">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Identification Number</div>
              <div className="font-mono text-sm text-slate-700 font-bold">{dbUser?.identificationNumber || "None"}</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 mb-6">Personal Information</h3>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name</label>
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Number</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nationality</label>
              <input required value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Marital Status</label>
              <select value={form.marital} onChange={(e) => setForm({ ...form, marital: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all">
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Occupation</label>
              <input required value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address Details</label>
              <textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-all resize-none" />
            </div>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-0 ${saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
              style={{ boxShadow: "0 8px 24px rgba(29,78,216,0.25)" }}>
              {loading ? "Saving Details..." : saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Profile"}
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage({ onRefresh }: { onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [confirm, setConfirm] = useState<{ user: any; action: "approve" | "reject" } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdminList = async () => {
    try {
      const data = await api.getAllUsers();
      setAdminUsers(data);
    } catch (err) {
      console.error("Failed to load users for approvals", err);
    }
  };

  useEffect(() => {
    fetchAdminList();
  }, []);

  const handleKYCAction = async (user: any, action: "approve" | "reject") => {
    setLoading(true);
    try {
      const nextStatus = action === "approve" ? "APPROVED" : "REJECTED";
      await api.updateUserStatus(user.userId, nextStatus);
      setConfirm(null);
      await fetchAdminList();
      onRefresh();
    } catch (err: any) {
      alert("Status update failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = adminUsers.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch = (u.emailId || "").toLowerCase().includes(term) ||
      (u.userProfile?.firstName || "").toLowerCase().includes(term) ||
      (u.userProfile?.lastName || "").toLowerCase().includes(term);

    const matchesStatus = filter === "all" || u.status?.toLowerCase() === filter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { l: "Total Users", v: adminUsers.length, icon: Users, cls: "text-blue-600 bg-blue-50" },
    { l: "Approved", v: adminUsers.filter((u) => u.status === "APPROVED").length, icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50" },
    { l: "Pending", v: adminUsers.filter((u) => u.status === "PENDING").length, icon: Clock, cls: "text-amber-600 bg-amber-50" },
    { l: "Rejected", v: adminUsers.filter((u) => u.status === "REJECTED").length, icon: XCircle, cls: "text-red-500 bg-red-50" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm"
            style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.04)" }}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.cls}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.v}</p>
              <p className="text-xs text-slate-400">{s.l}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm" style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.04)" }}>
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-blue-500 transition-all" />
          </div>
          <div className="flex gap-1.5">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border-0 bg-transparent ${filter === f ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["User Details", "Contact / Email", "Verification Identification", "KYC Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-slate-400">No accounts require verification checks.</td>
                </tr>
              ) : (
                filtered.map((user, i) => {
                  const nameStr = user.userProfile?.firstName 
                    ? `${user.userProfile.firstName} ${user.userProfile.lastName || ""}`
                    : user.emailId;
                  return (
                    <motion.tr key={user.userId || i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
                            {initials(nameStr)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 whitespace-nowrap">{nameStr}</p>
                            <p className="text-xs text-slate-400">UID: {user.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 text-xs">
                        <div className="font-bold">{user.emailId}</div>
                        <div>{user.contactNo}</div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-500 font-bold">{user.identificationNumber || "Not allocated"}</td>
                      <td className="px-4 py-4"><StatusBadge status={user.status} /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {user.status === "PENDING" && (
                            <>
                              <button onClick={() => setConfirm({ user, action: "approve" })}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer">
                                Approve
                              </button>
                              <button onClick={() => setConfirm({ user, action: "reject" })}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 border border-red-200 transition-all cursor-pointer">
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setConfirm(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl p-7 max-w-sm w-full"
              style={{ boxShadow: "0 24px 80px rgba(15,23,42,0.18)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirm.action === "approve" ? "bg-emerald-100" : "bg-red-100"}`}>
                {confirm.action === "approve"
                  ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  : <XCircle className="w-6 h-6 text-red-600" />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-1.5">
                {confirm.action === "approve" ? "Approve KYC?" : "Reject KYC?"}
              </h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                This will execute the verification checks for profile **{confirm.user.emailId}**.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all cursor-pointer">
                  Cancel
                </button>
                <button onClick={() => handleKYCAction(confirm.user, confirm.action)} disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer border-0 ${confirm.action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
                  {loading ? "Processing..." : confirm.action === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [loggedIn, setLoggedIn] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Live session states
  const [currentUser, setCurrentUserLocal] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);

  // Function to pull user state from backend services
  const refreshLedgerState = async (sessionUser = currentUser) => {
    if (!sessionUser) return;
    try {
      const userDetails = await api.getUserById(sessionUser.userId);
      setDbUser(userDetails);
      
      try {
        const accountDetails = await api.getAccountByUserId(sessionUser.userId);
        setActiveAccount(accountDetails);
        
        try {
          const txList = await api.getTransactionsByAccount(accountDetails.accountNumber);
          setTransactionsList(txList);
        } catch (txErr) {
          console.log("No transactions recorded for account yet");
          setTransactionsList([]);
        }
      } catch (accErr) {
        console.log("No active account setup found for user");
        setActiveAccount(null);
        setTransactionsList([]);
      }
    } catch (err) {
      console.error("Failed to refresh user profile data", err);
    }
  };

  useEffect(() => {
    const sessionUser = getCurrentUser();
    if (sessionUser) {
      setCurrentUserLocal(sessionUser);
      setLoggedIn(true);
      setPage("dashboard");
      refreshLedgerState(sessionUser);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleLogin = async (email: string) => {
    if (getAppMode() === "mock") {
      const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
      const matched = users.find((u: any) => u.emailId.toLowerCase() === email.toLowerCase());
      if (!matched) {
        throw new Error("Invalid email credentials in Mock Database");
      }
      if (matched.status === "PENDING") {
        throw new Error("Your user registration is PENDING. Use the Admin Approvals panel to approve it.");
      }
      setCurrentUser(matched.emailId, matched.userId);
      setCurrentUserLocal({ emailId: matched.emailId, userId: matched.userId });
      setLoggedIn(true);
      setPage("dashboard");
      await refreshLedgerState({ emailId: matched.emailId, userId: matched.userId });
    } else {
      // Real Gateway Mode - verify credentials
      try {
        const usersList = await api.getAllUsers();
        const matched = usersList.find((u: any) => u.emailId.toLowerCase() === email.toLowerCase());
        if (!matched) {
          throw new Error("No user registered with this email. Please register first.");
        }
        if (matched.status === "PENDING") {
          throw new Error("KYC Verification is Pending approval. Ask an administrator to approve your profile.");
        }
        setCurrentUser(matched.emailId, matched.userId);
        setCurrentUserLocal({ emailId: matched.emailId, userId: matched.userId });
        setLoggedIn(true);
        setPage("dashboard");
        await refreshLedgerState({ emailId: matched.emailId, userId: matched.userId });
      } catch (err: any) {
        throw new Error(err.message || "Failed to authenticate. Ensure the backend gateway & databases are running.");
      }
    }
  };

  const handleLogout = () => {
    logoutUser();
    setLoggedIn(false);
    setCurrentUserLocal(null);
    setDbUser(null);
    setActiveAccount(null);
    setTransactionsList([]);
    setPage("login");
  };

  if (!loggedIn) {
    if (page === "register") return <RegisterPage onBack={() => setPage("login")} />;
    return (
      <LoginPage
        onLogin={handleLogin}
        onRegister={() => setPage("register")}
      />
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage dbUser={dbUser} activeAccount={activeAccount} transactionsList={transactionsList} />;
      case "accounts":  return <AccountsPage dbUser={dbUser} activeAccount={activeAccount} transactionsList={transactionsList} onRefresh={refreshLedgerState} />;
      case "deposit":   return <DepositPage activeAccount={activeAccount} onRefresh={refreshLedgerState} />;
      case "transfer":  return <TransferPage activeAccount={activeAccount} onRefresh={refreshLedgerState} />;
      case "profile":   return <ProfilePage dbUser={dbUser} onRefresh={refreshLedgerState} />;
      case "admin":     return <AdminPage onRefresh={refreshLedgerState} />;
      default:          return <DashboardPage dbUser={dbUser} activeAccount={activeAccount} transactionsList={transactionsList} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F7F8FA" }}>
      <Sidebar page={page} onNavigate={setPage} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} user={dbUser} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header page={page} userProfile={dbUser} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <DevModeToggle />
    </div>
  );
}
