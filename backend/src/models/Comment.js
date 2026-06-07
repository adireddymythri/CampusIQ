const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', index: true },
    discussionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', index: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    upvotes: { type: Number, default: 0, index: true },
    downvotes: { type: Number, default: 0, index: true },
    isHidden: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

CommentSchema.index({ noteId: 1, createdAt: -1 })
CommentSchema.index({ discussionId: 1, createdAt: -1 })

module.exports = mongoose.model('Comment', CommentSchema)

