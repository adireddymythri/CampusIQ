const nodemailer = require('nodemailer')
const { env } = require('../config/env')

function createTransport() {
  if (!env.SMTP_HOST) return null
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: false,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  })
}

const transport = createTransport()

async function sendMail({ to, subject, text }) {
  if (!transport || !env.MAIL_FROM) {
    // eslint-disable-next-line no-console
    console.log('[mail:dev]', { to, subject, text })
    return
  }
  await transport.sendMail({ from: env.MAIL_FROM, to, subject, text })
}

module.exports = { sendMail }

