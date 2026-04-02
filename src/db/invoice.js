const Database = require('better-sqlite3');
const path = require('path');
const { format } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

const db = new Database(path.join(__dirname, '../../data/secretary.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS invoice_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    date TEXT,
    sequence INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

function generateNumber(type) {
  const now = toZonedTime(new Date(), 'Asia/Tokyo');
  const dateStr = format(now, 'yyyyMMdd');
  const prefix = type === 'invoice' ? 'INV' : 'QUO';

  const last = db.prepare(`
    SELECT sequence FROM invoice_numbers
    WHERE type = ? AND date = ?
    ORDER BY sequence DESC
    LIMIT 1
  `).get(type, dateStr);

  const sequence = last ? last.sequence + 1 : 1;

  db.prepare(`
    INSERT INTO invoice_numbers (type, date, sequence)
    VALUES (?, ?, ?)
  `).run(type, dateStr, sequence);

  return `${prefix}-${dateStr}-${String(sequence).padStart(3, '0')}`;
}

module.exports = { generateNumber };
