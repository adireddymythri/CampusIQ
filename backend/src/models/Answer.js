const mongoose = require('mongoose')

const AnswerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    selectedOptionIndex: { type: Number, required: true, min: 0 },
    isCorrect: { type: Boolean, default: false, index: true },
    timeTakenMs: { type: Number, default: 0 },
  },
  { timestamps: true },
)

AnswerSchema.index({ userId: 1, quizId: 1, createdAt: -1 })

module.exports = mongoose.model('Answer', AnswerSchema)

