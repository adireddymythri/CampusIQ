const { Server } = require('socket.io')
const { env } = require('../config/env')

function attachSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    socket.emit('hello', { ok: true, t: Date.now() })

    socket.on('disconnect', () => {})
  })

  return io
}

module.exports = { attachSocket }

