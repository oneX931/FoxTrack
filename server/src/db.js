import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { migrations } from './schema.js'

function migrate(db) {
  const { user_version: current } = db.prepare('PRAGMA user_version').get()
  for (let version = current; version < migrations.length; version += 1) {
    db.exec('BEGIN')
    try {
      db.exec(migrations[version])
      db.exec(`PRAGMA user_version = ${version + 1}`)
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  }
}

export function openDatabase(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec('PRAGMA busy_timeout = 5000')
  migrate(db)
  return db
}

export function isUniqueViolation(error) {
  return error?.code === 'ERR_SQLITE_ERROR' && (error.errcode === 2067 || /UNIQUE constraint failed/.test(error.message))
}

export function uniqueViolationColumn(error) {
  const match = /UNIQUE constraint failed: ([\w.]+)/.exec(error?.message ?? '')
  return match ? match[1] : null
}
