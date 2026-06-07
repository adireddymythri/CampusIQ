const { Router } = require('express')
const bcrypt = require('bcryptjs')
const passport = require('passport')

const User = require('../../../models/User')
const { isGoogleAuthConfigured } = require('../../../config/passport')
const { ApiError } = require('../../../utils/ApiError')
const { env } = require('../../../config/env')
const { randomCode, randomToken, sha256 } = require('../../../utils/crypto')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../../utils/jwt')
const { sendMail } = require('../../../services/mail')
const { isAllowedCollegeEmail } = require('../../../utils/collegeEmail')

const { authRequired } = require('../../../middleware/auth')

const authRouter = Router()

/** @type {Map<string, { accessToken: string, refreshToken: string, expiresAt: number }>} */
const googleAuthCodes = new Map()

function issueGoogleAuthCode(accessToken, refreshToken) {
  const code = randomToken()
  googleAuthCodes.set(code, {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 5 * 60_000,
  })
  for (const [key, entry] of googleAuthCodes) {
    if (entry.expiresAt < Date.now()) googleAuthCodes.delete(key)
  }
  return code
}

authRouter.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select('-passwordHash -refreshTokenHash')
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found')
    res.json({ ok: true, user })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {}

    if (!name || !email || !password) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing fields')
    }
    if (!isAllowedCollegeEmail(email, env.COLLEGE_EMAIL_ALLOWLIST)) {
      throw new ApiError(400, 'COLLEGE_EMAIL_REQUIRED', 'Use a verified college email')
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() })
    if (existing) throw new ApiError(409, 'EMAIL_TAKEN', 'Email already exists')

    const passwordHash = await bcrypt.hash(String(password), 12)
    const code = randomCode(6)
    const codeHash = sha256(code)

    const user = await User.create({
      name,
      email,
      passwordHash,
      authProvider: 'password',
      isEmailVerified: false,
      emailVerification: {
        codeHash,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
    })

    await sendMail({
      to: user.email,
      subject: 'StudyHub verification code',
      text: `Your StudyHub verification code is: ${code}\n\nThis code expires in 15 minutes.`,
    })

    res.status(201).json({ ok: true })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/verify-email', async (req, res, next) => {
  try {
    const { email, code } = req.body ?? {}
    if (!email || !code) throw new ApiError(400, 'VALIDATION_ERROR', 'Missing fields')

    const user = await User.findOne({ email: String(email).toLowerCase() })
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found')
    if (user.isEmailVerified) return res.json({ ok: true })

    if (!user.emailVerification?.codeHash || !user.emailVerification?.expiresAt) {
      throw new ApiError(400, 'INVALID_CODE', 'Verification not requested')
    }
    if (user.emailVerification.expiresAt.getTime() < Date.now()) {
      throw new ApiError(400, 'CODE_EXPIRED', 'Verification code expired')
    }
    if (sha256(String(code)) !== user.emailVerification.codeHash) {
      throw new ApiError(400, 'INVALID_CODE', 'Invalid verification code')
    }

    user.isEmailVerified = true
    user.emailVerification = undefined
    user.lastLoginAt = new Date()
    await user.save()

    const accessToken = signAccessToken({ sub: String(user._id), role: user.role })
    const refreshToken = signRefreshToken({ sub: String(user._id), role: user.role })
    user.refreshTokenHash = sha256(refreshToken)
    await user.save()

    res.json({ ok: true, accessToken, refreshToken })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {}
    if (!email || !password) throw new ApiError(400, 'VALIDATION_ERROR', 'Missing fields')

    const user = await User.findOne({ email: String(email).toLowerCase() })
    if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials')
    if (user.isDisabled) throw new ApiError(403, 'DISABLED', 'Account disabled')
    if (!user.passwordHash) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials')

    const ok = await bcrypt.compare(String(password), user.passwordHash)
    if (!ok) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials')
    if (!user.isEmailVerified) throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email first')

    user.lastLoginAt = new Date()
    await user.save()

    const accessToken = signAccessToken({ sub: String(user._id), role: user.role })
    const refreshToken = signRefreshToken({ sub: String(user._id), role: user.role })
    user.refreshTokenHash = sha256(refreshToken)
    await user.save()

    res.json({ ok: true, accessToken, refreshToken })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {}
    if (!refreshToken) throw new ApiError(400, 'VALIDATION_ERROR', 'Missing refresh token')

    const decoded = verifyRefreshToken(String(refreshToken))
    const user = await User.findById(decoded.sub)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Invalid refresh token')
    if (!user.refreshTokenHash || user.refreshTokenHash !== sha256(String(refreshToken))) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid refresh token')
    }

    const accessToken = signAccessToken({ sub: String(user._id), role: user.role })
    const nextRefresh = signRefreshToken({ sub: String(user._id), role: user.role })
    user.refreshTokenHash = sha256(nextRefresh)
    await user.save()

    res.json({ ok: true, accessToken, refreshToken: nextRefresh })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body ?? {}
    if (!email) throw new ApiError(400, 'VALIDATION_ERROR', 'Missing email')

    const user = await User.findOne({ email: String(email).toLowerCase() })
    if (!user) {
      // Return ok even if user doesn't exist to prevent email enumeration
      return res.json({ ok: true })
    }

    const token = randomCode(8)
    const tokenHash = sha256(token)

    user.passwordReset = {
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60_000), // 15 mins
    }
    await user.save()

    await sendMail({
      to: user.email,
      subject: 'StudyHub Password Reset',
      text: `Your password reset code is: ${token}\n\nThis code expires in 15 minutes. If you didn't request this, you can ignore this email.`,
    })

    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body ?? {}
    if (!email || !code || !newPassword) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing fields')
    }

    const user = await User.findOne({ email: String(email).toLowerCase() })
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found')

    if (!user.passwordReset?.tokenHash || !user.passwordReset?.expiresAt) {
      throw new ApiError(400, 'INVALID_CODE', 'Password reset not requested')
    }
    if (user.passwordReset.expiresAt.getTime() < Date.now()) {
      throw new ApiError(400, 'CODE_EXPIRED', 'Reset code expired')
    }
    if (sha256(String(code)) !== user.passwordReset.tokenHash) {
      throw new ApiError(400, 'INVALID_CODE', 'Invalid reset code')
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 12)
    user.passwordReset = undefined
    await user.save()

    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

authRouter.get('/google/status', (_req, res) => {
  res.json({ enabled: isGoogleAuthConfigured() })
})

authRouter.post('/google/exchange', async (req, res, next) => {
  try {
    const { code } = req.body ?? {}
    if (!code) throw new ApiError(400, 'VALIDATION_ERROR', 'Missing code')

    const entry = googleAuthCodes.get(String(code))
    googleAuthCodes.delete(String(code))
    if (!entry || entry.expiresAt < Date.now()) {
      throw new ApiError(401, 'INVALID_CODE', 'Sign-in expired, try Google again')
    }

    res.json({
      ok: true,
      accessToken: entry.accessToken,
      refreshToken: entry.refreshToken,
    })
  } catch (e) {
    next(e)
  }
})

if (isGoogleAuthConfigured()) {
  authRouter.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
  )

  authRouter.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
      try {
        if (err) return next(err)
        if (!user) {
          const reason =
            info?.message === 'COLLEGE_EMAIL_REQUIRED' ? 'college_email' : 'google'
          return res.redirect(`${env.CLIENT_ORIGIN}/login?error=${reason}`)
        }

        user.lastLoginAt = new Date()
        const accessToken = signAccessToken({ sub: String(user._id), role: user.role })
        const refreshToken = signRefreshToken({ sub: String(user._id), role: user.role })
        user.refreshTokenHash = sha256(refreshToken)
        await user.save()

        const target = new URL('/auth/google/callback', env.CLIENT_ORIGIN)
        target.searchParams.set('code', issueGoogleAuthCode(accessToken, refreshToken))
        res.redirect(target.href)
      } catch (e) {
        next(e)
      }
    })(req, res, next)
  })
}

module.exports = { authRouter }

