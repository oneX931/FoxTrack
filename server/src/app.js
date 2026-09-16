import fs from 'node:fs'
import path from 'node:path'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { createRequireAuth } from './middleware/auth.js'
import { apiNotFound, createErrorHandler, createRequestLogger } from './middleware/errors.js'
import { createOriginGuard } from './middleware/origin.js'
import { createAuthRouter } from './routes/auth.js'
import { createLibraryRouter } from './routes/library.js'
import { createSearchRouter } from './routes/search.js'
import { createSessions } from './services/sessions.js'

const DEFAULT_API_ORIGIN = 'https://api.thegamesdb.net'

function imageSources(config) {
  const sources = ["'self'", 'data:', 'https://cdn.thegamesdb.net']
  if (URL.canParse(config.tgdbBaseUrl)) {
    const { origin } = new URL(config.tgdbBaseUrl)
    if (origin !== DEFAULT_API_ORIGIN) sources.push(origin)
  }
  return sources
}

function serveClient(app, config) {
  const indexFile = path.join(config.staticDir, 'index.html')
  if (!fs.existsSync(indexFile)) return

  app.use(
    express.static(config.staticDir, {
      index: false,
      setHeaders(res, filePath) {
        if (/[\\/](assets|css|js)[\\/]/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    }),
  )

  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(indexFile)
  })
}

export function createApp({ config, db, tgdb, logger = console }) {
  const app = express()
  const sessions = createSessions({ db, config })
  const requireAuth = createRequireAuth(sessions)

  app.set('trust proxy', config.trustProxy)
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': imageSources(config),
          'upgrade-insecure-requests': config.cookieSecure ? [] : null,
        },
      },
    }),
  )
  if (config.logRequests) app.use(createRequestLogger(logger))
  app.use(express.json({ limit: '200kb' }))
  app.use(cookieParser())

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
  app.use('/api', createOriginGuard(config.allowedOrigins, { allowLanOrigins: config.allowLanOrigins }))
  app.use('/api/auth', createAuthRouter({ db, config, sessions, requireAuth }))
  app.use('/api/search', requireAuth, createSearchRouter({ db, tgdb, config }))
  app.use('/api/library', requireAuth, createLibraryRouter({ db, tgdb }))
  app.use('/api', apiNotFound)

  serveClient(app, config)
  app.use(createErrorHandler(logger))
  return app
}
