const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'sleep.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS sleep (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sleep_start TEXT NOT NULL,
      wake_up TEXT NOT NULL,
      duration REAL GENERATED ALWAYS AS (
        ROUND((julianday(wake_up) - julianday(sleep_start)) * 24, 2)
      ) VIRTUAL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Sleep table ready');
      // Insert sample data if empty
      db.get("SELECT COUNT(*) as count FROM sleep", (err, row) => {
        if (err) return;
        if (row.count === 0) {
          insertSampleData();
        }
      });
    }
  });
}

function insertSampleData() {
  
  const sampleData = [
    ['2023-11-01 23:00:00', '2023-11-02 07:30:00'],
    ['2023-11-02 22:45:00', '2023-11-03 06:45:00'],
    ['2023-11-03 23:30:00', '2023-11-04 08:00:00']
  ];

  sampleData.forEach(([start, end]) => {
    db.run(
      'INSERT INTO sleep (sleep_start, wake_up) VALUES (?, ?)',
      [start, end],
      (err) => {
        if (err) console.error('Error inserting sample data:', err.message);
      }
    );
  });
}

module.exports = db;