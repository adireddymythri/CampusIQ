import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!user) {
    navigate("/login");
    return null;
  }

  if (user.isEmailVerified) {
    navigate("/app");
    return null;
  }

  async function onVerify(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/verify-email", {
        email: user?.email,
        code: code.trim(),
      });
      await refreshUser();
      window.location.assign("/app");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#080b20] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-44 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-700/30 via-indigo-600/25 to-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[26rem] rounded-3xl border border-white/10 bg-[#0b112f]/85 p-7 shadow-2xl shadow-indigo-900/20 backdrop-blur"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-[1.6rem] font-semibold text-slate-100">
              <span className="grid size-7 place-items-center rounded-lg bg-white/10 ring-1 ring-white/10">
                <Sparkles className="size-4 text-cyan-200" />
              </span>
              CampusIQ
            </div>
            <div className="mt-4 text-3xl font-semibold">Verify Email</div>
            <div className="mt-1 text-sm text-slate-300">
              We sent a code to {user.email}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={onVerify}>
            <div>
              <label className="text-xs text-slate-300" htmlFor="code">
                Verification code
              </label>
              <input
                id="code"
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-indigo-400/50"
                placeholder="6-digit code"
                inputMode="numeric"
                value={code}
                onChange={(ev) => setCode(ev.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full mt-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel and Logout
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
