import path from 'node:path'
import { createApp } from './app.js'
import { loadConfig, serverRoot } from './config.js'
import { openDatabase } from './db.js'
import { createTgdbClient } from './services/tgdb.js'

try {
  process.loadEnvFile(path.join(serverRoot, '.env'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const config = loadConfig()
const db = openDatabase(config.databasePath)
const tgdb = createTgdbClient({ apiKey: config.tgdbApiKey, baseUrl: config.tgdbBaseUrl, db })
const app = createApp({ config, db, tgdb })

if (!config.tgdbApiKey) {
  console.warn('TGDB_API_KEY не задан: поиск и добавление игр работать не будут. Укажите ключ в server/.env')
}

const listenArgs = config.host ? [config.port, config.host] : [config.port]
const server = app.listen(...listenArgs, () => {
  console.log(`FoxTrack API запущен: http://localhost:${config.port}`)
})

function shutdown() {
  server.close(() => {
    db.close()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
