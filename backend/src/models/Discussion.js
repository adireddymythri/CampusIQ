const mongoose = require('mongoose')

const DiscussionSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    body: { type: String, required: true, trim: true, maxlength: 20000 },
    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    bestAnswerCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    stats: {
      views: { type: Number, default: 0, index: true },
      upvotes: { type: Number, default: 0, index: true },
      downvotes: { type: Number, default: 0, index: true },
      replies: { type: Number, default: 0, index: true },
    },
    isHidden: { type: Boolean, default: false, index: true },
    isFacultyAnswered: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

DiscussionSchema.index({ title: 'text', body: 'text' })
DiscussionSchema.index({ 'stats.upvotes': -1, createdAt: -1 })

module.exports = mongoose.model('Discussion', DiscussionSchema)

