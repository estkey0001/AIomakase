const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/secretary.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    line_user_id TEXT PRIMARY KEY,
    secretary_name TEXT DEFAULT '秘書',
    user_name TEXT DEFAULT 'ご主人様',
    personality TEXT DEFAULT 'cool',
    setup_completed INTEGER DEFAULT 0,
    setup_step INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

function getUser(lineUserId) {
  return db.prepare('SELECT * FROM users WHERE line_user_id = ?').get(lineUserId);
}

function createUser(lineUserId) {
  db.prepare(`
    INSERT OR IGNORE INTO users (line_user_id)
    VALUES (?)
  `).run(lineUserId);
  return getUser(lineUserId);
}

function updateUser(lineUserId, updates) {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  db.prepare(`
    UPDATE users SET ${fields}, updated_at = datetime('now')
    WHERE line_user_id = ?
  `).run(...values, lineUserId);
  return getUser(lineUserId);
}

module.exports = { getUser, createUser, updateUser };
