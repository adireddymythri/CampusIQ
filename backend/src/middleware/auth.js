const { ApiError } = require('../utils/ApiError')
const { verifyAccessToken } = require('../utils/jwt')

function authRequired(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return next(new ApiError(401, 'UNAUTHORIZED', 'Missing access token'))

  try {
    req.user = verifyAccessToken(token)
    return next()
  } catch {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Invalid access token'))
  }
}

function requireRole(roles) {
  const allowed = new Set(roles)
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'UNAUTHORIZED', 'Unauthorized'))
    if (!allowed.has(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'Insufficient permissions'))
    }
    return next()
  }
}

module.exports = { authRequired, requireRole }

