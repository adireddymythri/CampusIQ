const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')
const passport = require('passport')
const path = require('path')

const { env } = require('./config/env')
const { configurePassport } = require('./config/passport')
const { apiRouter } = require('./routes')
const { notFound } = require('./middleware/notFound')
const { errorHandler } = require('./middleware/errorHandler')
const { xssMiddleware } = require('./middleware/xss')

function createApp() {
  const app = express()

  configurePassport()
  app.use(passport.initialize())

  app.set('trust proxy', 1)

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      xFrameOptions: false,
    }),
  )
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  )
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
  app.use(cookieParser())

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 240,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(mongoSanitize())
  app.use(xssMiddleware())

  app.get('/health', (_req, res) => res.json({ ok: true }))
  app.use('/api', apiRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = { createApp }

