const mongoose = require('mongoose')

const ActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['note_view', 'note_upload', 'note_rate', 'quiz_start', 'quiz_finish', 'discussion_post', 'ai_chat'],
      required: true,
      index: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId, index: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true },
)

ActivitySchema.index({ userId: 1, createdAt: -1 })
ActivitySchema.index({ type: 1, createdAt: -1 })

module.exports = mongoose.model('Activity', ActivitySchema)

