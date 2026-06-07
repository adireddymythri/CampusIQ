import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const PENDING_KEY = "campusiq_google_pending";
const CODE_KEY = "campusiq_google_code";

export function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const exchanging = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function completeLogin() {
      sessionStorage.removeItem(PENDING_KEY);
      sessionStorage.removeItem(CODE_KEY);
      await refreshUser();
      window.location.assign("/app");
    }

    async function failLogin() {
      sessionStorage.removeItem(PENDING_KEY);
      sessionStorage.removeItem(CODE_KEY);
      window.location.assign("/login?error=google");
    }

    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get("code");

      if (codeFromUrl) {
        sessionStorage.setItem(CODE_KEY, codeFromUrl);
        sessionStorage.setItem(PENDING_KEY, "1");
        window.history.replaceState(null, "", window.location.pathname);
      }

      const exchangeCode = codeFromUrl || sessionStorage.getItem(CODE_KEY);
      if (!exchangeCode) {
        await failLogin();
        return;
      }

      if (
        !codeFromUrl &&
        localStorage.getItem("accessToken") &&
        sessionStorage.getItem(PENDING_KEY)
      ) {
        try {
          await completeLogin();
        } catch {
          await failLogin();
        }
        return;
      }

      if (exchanging.current) return;
      exchanging.current = true;

      try {
        const { data } = await api.post("/auth/google/exchange", {
          code: exchangeCode,
        });

        if (!data.accessToken || !data.refreshToken) {
          throw new Error("Missing tokens");
        }

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        await completeLogin();
      } catch {
        if (
          localStorage.getItem("accessToken") &&
          sessionStorage.getItem(PENDING_KEY)
        ) {
          try {
            await completeLogin();
            return;
          } catch {
            // fall through
          }
        }
        await failLogin();
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0F172A] text-slate-200">
      <p className="text-sm">Completing sign-in…</p>
    </div>
  );
}
