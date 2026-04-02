const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/secretary.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS sns_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    line_user_id TEXT,
    platform TEXT,
    content TEXT,
    hashtags TEXT,
    status TEXT DEFAULT 'draft',
    scheduled_at TEXT,
    posted_at TEXT,
    platform_post_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

function createDraft(lineUserId, platform, content, hashtags, scheduledAt) {
  const result = db.prepare(`
    INSERT INTO sns_posts (line_user_id, platform, content, hashtags, status, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    lineUserId,
    platform,
    content,
    JSON.stringify(hashtags || []),
    scheduledAt ? 'scheduled' : 'draft',
    scheduledAt || null
  );
  return result.lastInsertRowid;
}

function getDrafts(lineUserId, status, platform) {
  let query = 'SELECT * FROM sns_posts WHERE line_user_id = ?';
  const params = [lineUserId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (platform) {
    query += ' AND platform = ?';
    params.push(platform);
  }

  query += ' ORDER BY created_at DESC LIMIT 20';
  return db.prepare(query).all(...params);
}

function getPost(postId) {
  return db.prepare('SELECT * FROM sns_posts WHERE id = ?').get(postId);
}

function updatePostStatus(postId, status, platformPostId) {
  const updates = { status };
  if (status === 'posted') {
    updates.posted_at = new Date().toISOString();
  }
  if (platformPostId) {
    updates.platform_post_id = platformPostId;
  }

  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  db.prepare(`UPDATE sns_posts SET ${fields} WHERE id = ?`).run(...values, postId);
}

function deletePost(postId) {
  db.prepare('DELETE FROM sns_posts WHERE id = ?').run(postId);
}

function getScheduledPosts() {
  return db.prepare(`
    SELECT * FROM sns_posts
    WHERE status = 'scheduled'
    AND scheduled_at <= datetime('now')
  `).all();
}

module.exports = {
  createDraft,
  getDrafts,
  getPost,
  updatePostStatus,
  deletePost,
  getScheduledPosts
};
