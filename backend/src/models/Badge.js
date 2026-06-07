const mongoose = require('mongoose')

const BadgeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  },
  { timestamps: true },
)

BadgeSchema.index({ key: 1 }, { unique: true })

module.exports = mongoose.model('Badge', BadgeSchema)

