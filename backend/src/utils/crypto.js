const crypto = require('crypto')

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function randomCode(len = 6) {
  const digits = '0123456789'
  let out = ''
  for (let i = 0; i < len; i++) out += digits[Math.floor(Math.random() * digits.length)]
  return out
}

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex')
}

module.exports = { sha256, randomCode, randomToken }

