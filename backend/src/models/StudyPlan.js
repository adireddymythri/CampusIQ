const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 2000 },
    doneAt: { type: Date },
  },
  { _id: false },
)

const StudyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    examDate: { type: Date, index: true },
    tasksByDay: {
      type: [
        new mongoose.Schema(
          {
            day: { type: Date, required: true, index: true },
            tasks: { type: [TaskSchema], default: [] },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    generatedByAi: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

StudyPlanSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('StudyPlan', StudyPlanSchema)

