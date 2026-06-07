const { ApiError } = require('../utils/ApiError')

function errorHandler(err, _req, res, _next) {
  const apiErr =
    err instanceof ApiError
      ? err
      : new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong')

  // eslint-disable-next-line no-console
  if (apiErr.status >= 500) console.error(err)

  res.status(apiErr.status).json({
    ok: false,
    error: {
      code: apiErr.code,
      message: apiErr.message,
      details: apiErr.details ?? undefined,
    },
  })
}

module.exports = { errorHandler }

