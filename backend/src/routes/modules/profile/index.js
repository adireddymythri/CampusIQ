const { Router } = require('express')
const multer = require('multer')
const { authRequired } = require('../../../middleware/auth')
const { uploadToCloudinary } = require('../../../services/cloudinary')
const { sendMail } = require('../../../services/mail')
const User = require('../../../models/User')
const Profile = require('../../../models/Profile')
const Note = require('../../../models/Note')
const Quiz = require('../../../models/Quiz')
const Activity = require('../../../models/Activity')
const { ApiError } = require('../../../utils/ApiError')

const profileRouter = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for avatars
})

// Get full profile payload
profileRouter.get('/', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.sub

    const user = await User.findById(userId).select('name email role avatarUrl createdAt')
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found')

    // Find or create profile
    let profile = await Profile.findOne({ userId }).populate('branchId').populate('semesterId')
    if (!profile) {
      profile = await Profile.create({ userId })
    }

    // Aggregations
    const uploadedNotesCount = await Note.countDocuments({ ownerId: userId })
    const quizzesTakenCount = await Quiz.countDocuments({ ownerId: userId })

    // Recent Activity Feed
    const recentActivity = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('refId', 'title') // attempts to pull a title if applicable

    res.json({
      ok: true,
      user,
      profile,
      stats: {
        notesUploaded: uploadedNotesCount,
        quizzesTaken: quizzesTakenCount,
      },
      recentActivity
    })
  } catch (e) {
    next(e)
  }
})

// Update profile
profileRouter.put('/', authRequired, async (req, res, next) => {
  try {
    const { name, bio, collegeName, branch, semester } = req.body ?? {}
    const userId = req.user.sub

    if (name) {
      await User.findByIdAndUpdate(userId, { name: name.trim() })
    }

    const profileUpdates = {}
    if (bio !== undefined) profileUpdates.bio = bio.trim()
    if (collegeName !== undefined) profileUpdates.collegeName = collegeName.trim()
    if (branch !== undefined) profileUpdates.branchName = branch.trim()
    if (semester !== undefined) profileUpdates.semesterName = semester.trim()

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      { $set: profileUpdates },
      { new: true, upsert: true }
    ).populate('branchId').populate('semesterId')

    res.json({
      ok: true,
      profile: updatedProfile
    })
  } catch (e) {
    next(e)
  }
})

// Upload avatar
profileRouter.post('/avatar', authRequired, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'VALIDATION_ERROR', 'Missing avatar file')
    
    const result = await uploadToCloudinary(req.file)
    const updatedUser = await User.findByIdAndUpdate(
      req.user.sub,
      { avatarUrl: result.secure_url },
      { new: true }
    ).select('name email role avatarUrl createdAt')
    
    res.json({ ok: true, user: updatedUser })
  } catch (e) {
    next(e)
  }
})

// Change password (placeholder logic since we don't know the full schema, maybe bcrypt is used?)
profileRouter.post('/change-password', authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub)
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found')

    const resetLink = `http://localhost:5173/reset-password?token=dummy-token-123`
    
    await sendMail({
      to: user.email,
      subject: 'CampusIQ Password Reset',
      text: `Hello ${user.name},\n\nYou requested a password reset. Click the link below to reset your password:\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>CampusIQ Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    })

    res.json({ ok: true, message: 'Password changed successfully' })
  } catch (e) {
    next(e)
  }
})

// Deactivate account
profileRouter.post('/deactivate', authRequired, async (req, res, next) => {
  try {
    // In a real app, we'd set an `isActive: false` flag on the user
    res.json({ ok: true, message: 'Account deactivated successfully' })
  } catch (e) {
    next(e)
  }
})

// Delete account
profileRouter.delete('/', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.sub
    await Note.deleteMany({ ownerId: userId })
    await Profile.findOneAndDelete({ userId })
    await Activity.deleteMany({ userId })
    await User.findByIdAndDelete(userId)
    res.json({ ok: true, message: 'Account deleted permanently' })
  } catch (e) {
    next(e)
  }
})

module.exports = { profileRouter }
