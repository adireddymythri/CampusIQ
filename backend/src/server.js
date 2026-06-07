const http = require('http')

const { createApp } = require('./app')
const { connectDb } = require('./config/db')
const { env } = require('./config/env')
const { attachSocket } = require('./socket')

async function main() {
  await connectDb(env.MONGODB_URI)

  const app = createApp()
  const server = http.createServer(app)
  attachSocket(server)

  const startPort = Number(env.PORT) || 8090
  const maxTries = 10
  let attempt = 0

  const listen = (port) =>
    new Promise((resolve, reject) => {
      const onError = (err) => {
        server.off('listening', onListening)
        reject(err)
      }
      const onListening = () => {
        server.off('error', onError)
        resolve(port)
      }
      server.once('error', onError)
      server.once('listening', onListening)
      server.listen(port)
    })

  // Try a small port range to avoid local conflicts.
  while (attempt < maxTries) {
    const port = startPort + attempt
    try {
      const bound = await listen(port)
      // eslint-disable-next-line no-console
      console.log(`StudyHub API listening on http://localhost:${bound}`)
      return
    } catch (err) {
      if (err && err.code === 'EADDRINUSE') {
        attempt += 1
        continue
      }
      throw err
    }
  }

  throw new Error(`No free port found in range ${startPort}-${startPort + maxTries - 1}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

