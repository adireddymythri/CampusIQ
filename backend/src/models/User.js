const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
      index: true,
    },
    authProvider: {
      type: String,
      enum: ['password', 'google'],
      default: 'password',
    },
    google: {
      id: { type: String },
    },
    isEmailVerified: { type: Boolean, default: false, index: true },
    emailVerification: {
      codeHash: { type: String },
      expiresAt: { type: Date },
    },
    passwordReset: {
      tokenHash: { type: String },
      expiresAt: { type: Date },
    },
    refreshTokenHash: { type: String },
    isDisabled: { type: Boolean, default: false, index: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
)

UserSchema.index({ email: 1 }, { unique: true })

module.exports = mongoose.model('User', UserSchema)

