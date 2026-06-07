const z = require('zod')
const dotenv = require('dotenv')
const crypto = require('crypto')

dotenv.config()

function devSecret(name) {
  return `dev_${name}_${crypto.randomBytes(24).toString('hex')}`
}

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(8090),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/studyhub'),
  JWT_ACCESS_SECRET: z.string().min(20).optional(),
  JWT_REFRESH_SECRET: z.string().min(20).optional(),
  JWT_ACCESS_TTL_MIN: z.coerce.number().default(15),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(30),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  MAIL_FROM: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),

  // Comma-separated domains like "mit.edu,stanford.edu"
  COLLEGE_EMAIL_ALLOWLIST: z.string().optional(),
})

const parsed = EnvSchema.safeParse(process.env)
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

const nodeEnv = parsed.data.NODE_ENV
const accessSecret =
  parsed.data.JWT_ACCESS_SECRET ??
  (nodeEnv === 'production' ? undefined : devSecret('access'))
const refreshSecret =
  parsed.data.JWT_REFRESH_SECRET ??
  (nodeEnv === 'production' ? undefined : devSecret('refresh'))

if (nodeEnv === 'production' && (!accessSecret || !refreshSecret)) {
  // eslint-disable-next-line no-console
  console.error('Missing JWT secrets in production')
  process.exit(1)
}

const allowlist = (parsed.data.COLLEGE_EMAIL_ALLOWLIST ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

const env = {
  ...parsed.data,
  JWT_ACCESS_SECRET: accessSecret,
  JWT_REFRESH_SECRET: refreshSecret,
  COLLEGE_EMAIL_ALLOWLIST: allowlist,
}

module.exports = { env }

