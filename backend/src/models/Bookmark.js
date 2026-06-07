const mongoose = require('mongoose')

const BookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
  },
  { timestamps: true },
)

BookmarkSchema.index({ userId: 1, noteId: 1 }, { unique: true })

module.exports = mongoose.model('Bookmark', BookmarkSchema)

