const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['note', 'exam', 'discussion', 'ai', 'system'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, trim: true, maxlength: 2000 },
    meta: { type: Object, default: {} },
    readAt: { type: Date, index: true },
  },
  { timestamps: true },
)

NotificationSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', NotificationSchema)

