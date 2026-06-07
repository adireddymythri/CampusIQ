const { Router } = require('express')
const { authRequired } = require('../../../middleware/auth')
const Note = require('../../../models/Note')
const Activity = require('../../../models/Activity')
const Profile = require('../../../models/Profile')
const User = require('../../../models/User')

const dashboardRouter = Router()

dashboardRouter.get('/stats', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.sub

    // Fetch or create profile for XP and stats
    let profile = await Profile.findOne({ userId })
    if (!profile) {
      profile = await Profile.create({ userId })
    }

    const [notesViewed, notesUploaded] = await Promise.all([
      Activity.countDocuments({ userId, type: 'note_view' }),
      Note.countDocuments({ ownerId: userId })
    ])

    // Calculate rank based on XP
    const higherXpCount = await Profile.countDocuments({ xp: { $gt: profile.xp } })
    const rank = `#${higherXpCount + 1}`

    res.json({
      ok: true,
      stats: {
        notesViewed: notesViewed || 0,
        pointsEarned: profile.xp || 0,
        notesUploaded: notesUploaded || 0,
        rank
      }
    })
  } catch (e) {
    next(e)
  }
})

dashboardRouter.get('/summary', authRequired, async (req, res, next) => {
  try {
    const userId = req.user.sub

    // Fetch recent notes (latest 5)
    const recentNotes = await Note.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('subjectId', 'name')
      .populate('ownerId', 'name')

    // Fetch trending notes (most views)
    const trendingNotes = await Note.find({})
      .sort({ 'stats.views': -1 })
      .limit(5)
      .populate('ownerId', 'name')

    // Fetch recommended notes (for now, just different ones)
    const recommendedNotes = await Note.find({ ownerId: { $ne: userId } })
      .sort({ 'rating.avg': -1 })
      .limit(6)
      .populate('subjectId', 'name')

    res.json({
      ok: true,
      recentNotes,
      trendingNotes,
      recommendedNotes
    })
  } catch (e) {
    next(e)
  }
})

module.exports = { dashboardRouter }
