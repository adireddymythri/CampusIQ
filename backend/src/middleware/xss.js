const xss = require('xss')

const BODY_KEYS = new Set(['body', 'query', 'params'])

function sanitize(value) {
  if (typeof value === 'string') return xss(value)
  if (Array.isArray(value)) return value.map(sanitize)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = sanitize(v)
    return out
  }
  return value
}

function xssMiddleware() {
  return (req, _res, next) => {
    for (const k of BODY_KEYS) {
      if (req[k]) req[k] = sanitize(req[k])
    }
    next()
  }
}

module.exports = { xssMiddleware }

