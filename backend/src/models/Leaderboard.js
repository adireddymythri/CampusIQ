const mongoose = require('mongoose')

const LeaderboardSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ['global', 'college', 'branch', 'semester'], default: 'global' },
    scopeId: { type: mongoose.Schema.Types.ObjectId },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    xp: { type: Number, default: 0, index: true },
    rank: { type: Number, default: 0, index: true },
    period: { type: String, enum: ['all', 'week', 'month'], default: 'all', index: true },
  },
  { timestamps: true },
)

LeaderboardSchema.index({ scope: 1, scopeId: 1, period: 1, xp: -1 })
LeaderboardSchema.index({ scope: 1, scopeId: 1, period: 1, userId: 1 }, { unique: true })

module.exports = mongoose.model('Leaderboard', LeaderboardSchema)

