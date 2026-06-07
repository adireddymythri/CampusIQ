import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Eye, EyeOff } from 'lucide-react'

import { api, apiBase, apiErrorMessage } from '../../lib/api'

type Phase = 'register' | 'verify'

export function SignupPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [googleEnabled, setGoogleEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get<{ enabled: boolean }>('/auth/google/status')
        if (!cancelled) setGoogleEnabled(Boolean(data?.enabled))
      } catch {
        if (!cancelled) setGoogleEnabled(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function onRegister(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setInfo(null)
    setLoading(true)
    try {
      await api.post('/auth/signup', {
        name: name.trim(),
        email: email.trim(),
        password,
      })
      setPhase('verify')
      setInfo('We sent a verification code to your email. Enter it below to finish.')
    } catch (err) {
      setFormError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setInfo(null)
    setLoading(true)
    try {
      const { data } = await api.post<{ ok: boolean; accessToken?: string; refreshToken?: string }>('/auth/verify-email', {
        email: email.trim(),
        code: code.trim(),
      })
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken)
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
        window.location.assign('/app')
      } else {
        navigate('/login', { replace: true, state: { verified: true } })
      }
    } catch (err) {
      setFormError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function startGoogle() {
    if (!googleEnabled) {
      setFormError(
        'Google sign-in is not configured on the server yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL to the backend .env file.',
      )
      return
    }
    window.location.assign(`${apiBase}/api/auth/google`)
  }

  return (
    <div className="min-h-dvh bg-[#080b20] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-44 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-700/30 via-indigo-600/25 to-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-6rem] h-[22rem] w-[22rem] rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[26rem] rounded-3xl border border-white/10 bg-[#0b112f]/85 p-7 shadow-2xl shadow-indigo-900/20 backdrop-blur"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-[1.6rem] font-semibold text-slate-100">
              <span className="grid size-7 place-items-center rounded-lg bg-white/10 ring-1 ring-white/10">
                <Sparkles className="size-4 text-cyan-200" />
              </span>
              CampusIQ
            </div>
            <div className="mt-4 text-3xl font-semibold">
              {phase === 'register' ? 'Create Account' : 'Verify Email'}
            </div>
            <div className="mt-1 text-sm text-slate-300">
              {phase === 'register'
                ? 'Verify your college email to continue'
                : 'Enter the code from your email'}
            </div>
          </div>

          {info ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              {info}
            </div>
          ) : null}

          {formError ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {formError}
            </div>
          ) : null}

          {phase === 'register' ? (
            <form className="mt-6 space-y-4" onSubmit={onRegister}>
              <div>
                <label className="text-xs text-slate-300" htmlFor="signup-name">
                  Full name
                </label>
                <input
                  id="signup-name"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-indigo-400/50"
                  placeholder="Your name"
                  autoComplete="name"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-300" htmlFor="signup-email">
                  College Email
                </label>
                <input
                  id="signup-email"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-indigo-400/50"
                  placeholder="you@college.edu"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                />
                <div className="mt-2 text-xs text-slate-400">
                  Only verified college domains can sign up.
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-300" htmlFor="signup-password">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="signup-password"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 pr-10 text-sm outline-none placeholder:text-slate-500 focus:border-indigo-400/50"
                    placeholder="Create a strong password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send verification code'}
              </button>

              <div className="flex items-center gap-3 py-1 text-xs text-slate-400">
                <span className="h-px flex-1 bg-white/10" />
                or
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={startGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 ring-1 ring-white/10 hover:bg-white/10"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6.9 0 8.6-6.2 8-9.4H12z"
                  />
                  <path
                    fill="#34A853"
                    d="M3.8 7.3l3.2 2.3C7.8 8 9.7 6.5 12 6.5c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.7 12 2.7c-3.6 0-6.8 2.1-8.2 4.6z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 21.3c2.6 0 4.8-.9 6.4-2.4l-3-2.5c-.8.5-1.9.9-3.4.9-3.9 0-5.2-2.6-5.5-3.9l-3.2 2.5c1.4 2.7 4.3 5.4 8.7 5.4z"
                  />
                  <path
                    fill="#4285F4"
                    d="M21.3 12c0-.6-.1-1.1-.2-1.8H12v3.9h5.5c-.3 1.5-1.2 2.7-2.5 3.3l3 2.5c1.8-1.7 3.3-4.2 3.3-7.9z"
                  />
                </svg>
                Sign up with Google
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={onVerify}>
              <div>
                <label className="text-xs text-slate-300" htmlFor="signup-code">
                  Verification code
                </label>
                <input
                  id="signup-code"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-indigo-400/50"
                  placeholder="6-digit code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(ev) => setCode(ev.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Verifying…' : 'Verify email'}
              </button>

              <div className="flex items-center gap-3 py-1 text-xs text-slate-400">
                <span className="h-px flex-1 bg-white/10" />
                or
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={startGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 ring-1 ring-white/10 hover:bg-white/10"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6.9 0 8.6-6.2 8-9.4H12z"
                  />
                  <path
                    fill="#34A853"
                    d="M3.8 7.3l3.2 2.3C7.8 8 9.7 6.5 12 6.5c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.6 14.7 2.7 12 2.7c-3.6 0-6.8 2.1-8.2 4.6z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 21.3c2.6 0 4.8-.9 6.4-2.4l-3-2.5c-.8.5-1.9.9-3.4.9-3.9 0-5.2-2.6-5.5-3.9l-3.2 2.5c1.4 2.7 4.3 5.4 8.7 5.4z"
                  />
                  <path
                    fill="#4285F4"
                    d="M21.3 12c0-.6-.1-1.1-.2-1.8H12v3.9h5.5c-.3 1.5-1.2 2.7-2.5 3.3l3 2.5c1.8-1.7 3.3-4.2 3.3-7.9z"
                  />
                </svg>
                Sign up with Google
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-slate-200 hover:text-white">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
