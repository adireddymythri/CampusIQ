const mongoose = require('mongoose')

const QuizSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', index: true },
    title: { type: String, required: true, trim: true, index: true },
    mode: { type: String, enum: ['practice', 'timed'], default: 'practice', index: true },
    durationSec: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  },
  { timestamps: true },
)

QuizSchema.index({ ownerId: 1, createdAt: -1 })

module.exports = mongoose.model('Quiz', QuizSchema)

