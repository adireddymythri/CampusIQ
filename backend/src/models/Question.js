const mongoose = require('mongoose')

const OptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false },
)

const QuestionSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    prompt: { type: String, required: true, trim: true, maxlength: 5000 },
    options: { type: [OptionSchema], default: [] },
    explanation: { type: String, trim: true, maxlength: 10000 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', index: true },
    topic: { type: String, trim: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
)

QuestionSchema.index({ quizId: 1, order: 1 })

module.exports = mongoose.model('Question', QuestionSchema)

