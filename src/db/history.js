const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/secretary.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    line_user_id TEXT,
    role TEXT,
    content TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

function getHistory(lineUserId, limit = 40) {
  const rows = db.prepare(`
    SELECT role, content FROM conversations
    WHERE line_user_id = ?
    ORDER BY id DESC
    LIMIT ?
  `).all(lineUserId, limit);

  return rows.reverse().map(r => ({
    role: r.role,
    content: r.content
  }));
}

function saveHistory(lineUserId, userMessage, assistantMessage) {
  const insert = db.prepare(`
    INSERT INTO conversations (line_user_id, role, content)
    VALUES (?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insert.run(lineUserId, 'user', userMessage);
    insert.run(lineUserId, 'assistant', assistantMessage);

    // Keep only last 20 exchanges (40 rows)
    db.prepare(`
      DELETE FROM conversations
      WHERE line_user_id = ? AND id NOT IN (
        SELECT id FROM conversations
        WHERE line_user_id = ?
        ORDER BY id DESC
        LIMIT 40
      )
    `).run(lineUserId, lineUserId);
  });

  transaction();
}

module.exports = { getHistory, saveHistory };
