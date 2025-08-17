const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sleep.db');

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sleep_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      is_nap BOOLEAN NOT NULL DEFAULT 0,
      duration_hours REAL NOT NULL
    )
  `);
});

module.exports = db;
