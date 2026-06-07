const mongoose = require('mongoose')

const ProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    collegeName: { type: String, trim: true },
    collegeDomain: { type: String, lowercase: true, trim: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    branchName: { type: String, trim: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
    semesterName: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 500 },
    xp: { type: Number, default: 0, index: true },
    streakDays: { type: Number, default: 0 },
    lastStreakAt: { type: Date },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],

  },
  { timestamps: true },
)

module.exports = mongoose.model('Profile', ProfileSchema)

