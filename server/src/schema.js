import { STATUSES, DEFAULT_STATUS, REVIEW_MAX_LENGTH } from './constants.js'

const statusList = STATUSES.map((status) => `'${status}'`).join(', ')

export const migrations = [
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    username_key TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE user_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    thegamesdb_id INTEGER NOT NULL,
    title_key TEXT NOT NULL,
    title TEXT NOT NULL,
    cover_url TEXT,
    description TEXT,
    release_date TEXT,
    genres TEXT NOT NULL DEFAULT '[]',
    platforms TEXT NOT NULL DEFAULT '[]',
    selected_platform TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '${DEFAULT_STATUS}' CHECK (status IN (${statusList})),
    rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 10),
    review TEXT CHECK (review IS NULL OR length(review) <= ${REVIEW_MAX_LENGTH}),
    added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (user_id, thegamesdb_id),
    UNIQUE (user_id, title_key)
  );

  CREATE INDEX idx_user_games_user_added ON user_games (user_id, added_at DESC);

  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX idx_sessions_user ON sessions (user_id);
  CREATE INDEX idx_sessions_expires ON sessions (expires_at);

  CREATE TABLE dictionary_cache (
    name TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    fetched_at INTEGER NOT NULL
  );
  `,
  `
  ALTER TABLE users ADD COLUMN avatar TEXT;

  ALTER TABLE user_games ADD COLUMN selected_platforms TEXT NOT NULL DEFAULT '[]';
  UPDATE user_games SET selected_platforms = json_array(selected_platform);
  ALTER TABLE user_games DROP COLUMN selected_platform;
  `,
]
