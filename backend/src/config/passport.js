const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const { env } = require('./env')
const User = require('../models/User')
const { isAllowedCollegeEmail } = require('../utils/collegeEmail')

function isGoogleAuthConfigured() {
  return Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL,
  )
}

function configurePassport() {
  if (!isGoogleAuthConfigured()) return false

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase().trim()
          if (!email) {
            console.error('Google Auth Failed: No email returned from Google profile', profile)
            return done(null, false, { message: 'No email from Google' })
          }

          if (!isAllowedCollegeEmail(email, env.COLLEGE_EMAIL_ALLOWLIST)) {
            console.error('Google Auth Failed: Email not in allowlist:', email, 'Allowlist:', env.COLLEGE_EMAIL_ALLOWLIST)
            return done(null, false, { message: 'COLLEGE_EMAIL_REQUIRED' })
          }

          const googleId = String(profile.id)
          let user = await User.findOne({ 'google.id': googleId })
          if (user) return done(null, user)

          user = await User.findOne({ email })
          if (user) {
            // Even if they have a password, we can link the Google account to the same email!
            user.google = { id: googleId }
            user.authProvider = 'google'
            user.isEmailVerified = true
            if (!user.name && profile.displayName?.trim()) user.name = profile.displayName.trim()
            if (!user.avatarUrl && profile.photos?.[0]?.value) user.avatarUrl = profile.photos[0].value
            await user.save()
            return done(null, user)
          }

          const { sendMail } = require('../services/mail')
          const crypto = require('crypto')
          
          const code = Math.floor(100000 + Math.random() * 900000).toString()
          const codeHash = crypto.createHash('sha256').update(code).digest('hex')

          user = await User.create({
            email,
            name: profile.displayName?.trim() || email.split('@')[0],
            authProvider: 'google',
            google: { id: googleId },
            isEmailVerified: false,
            emailVerification: {
              codeHash,
              expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
            avatarUrl: profile.photos?.[0]?.value,
          })

          try {
            await sendMail({
              to: email,
              subject: 'StudyHub verification code',
              text: `Your StudyHub verification code is: ${code}\n\nThis code expires in 15 minutes.`,
            })
          } catch (mailErr) {
            console.error('Failed to send Google signup verification email', mailErr)
          }
          return done(null, user)
        } catch (e) {
          console.error('Google Auth Exception:', e)
          return done(e)
        }
      },
    ),
  )

  return true
}

module.exports = { configurePassport, isGoogleAuthConfigured }
