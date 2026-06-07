import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowLeft } from 'lucide-react'

import { api, apiErrorMessage } from '../../lib/api'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const stateEmail = (location.state as { email?: string } | undefined)?.email

  const [email] = useState(stateEmail || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  if (!stateEmail) {
    return <Navigate to="/login" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      })
      navigate('/login', { replace: true })
    } catch (err) {
      setFormError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
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
            <div className="mt-4 text-3xl font-semibold">New Password</div>
            <div className="mt-1 text-sm text-slate-300">
              Enter the reset code sent to {stateEmail}
            </div>
          </div>

          {formError ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {formError}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-xs text-slate-300" htmlFor="reset-code">
                Reset Code
              </label>
              <input
                id="reset-code"
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-400/50"
                placeholder="6-digit code"
                type="text"
                autoComplete="off"
                value={code}
                onChange={(ev) => setCode(ev.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-300" htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-400/50"
                placeholder="••••••••"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(ev) => setNewPassword(ev.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="inline-flex items-center gap-1 text-slate-400 hover:text-white">
              <ArrowLeft className="size-4" />
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
