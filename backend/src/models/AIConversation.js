const mongoose = require('mongoose')

const aiConversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' }, // Optional, can be null for general chat
  messages: [{
    id: { type: String },
    sender: { type: String, enum: ['user', 'ai'] },
    text: { type: String },
    timestamp: { type: Date },
    meta: { type: mongoose.Schema.Types.Mixed }
  }],
}, { timestamps: true })

module.exports = mongoose.model('AIConversation', aiConversationSchema)
