const mongoose = require('mongoose')
const { env } = require('./env')

mongoose.set('strictQuery', true)

async function connectDb(uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  } catch (err) {
    if (env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        'MongoDB connection failed (dev mode). Set MONGODB_URI to MongoDB Atlas or run local MongoDB.',
      )
      // eslint-disable-next-line no-console
      console.warn(err?.message ?? err)
      return
    }
    throw err
  }
}

module.exports = { connectDb }

