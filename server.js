const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Add a new sleep session
app.post('/api/sleep', (req, res) => {
  const { start_time, end_time, is_nap } = req.body;
  const duration = (new Date(end_time) - new Date(start_time)) / (1000 * 60 * 60);
  
  db.run(
    `INSERT INTO sleep_sessions (start_time, end_time, is_nap, duration_hours) 
     VALUES (?, ?, ?, ?)`,
    [start_time, end_time, is_nap ? 1 : 0, duration],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        start_time,
        end_time,
        is_nap,
        duration_hours: duration
      });
    }
  );
});

// Get all sleep sessions
app.get('/api/sleep', (req, res) => {
  db.all("SELECT * FROM sleep_sessions ORDER BY end_time DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get sleep averages
app.get('/api/sleep/averages', (req, res) => {
  const queries = {
    week1: `SELECT AVG(duration_hours) as avg FROM sleep_sessions 
            WHERE is_nap = 0 AND end_time >= datetime('now', '-7 days')`,
    week2: `SELECT AVG(duration_hours) as avg FROM sleep_sessions 
            WHERE is_nap = 0 AND end_time >= datetime('now', '-14 days')`,
    week3: `SELECT AVG(duration_hours) as avg FROM sleep_sessions 
            WHERE is_nap = 0 AND end_time >= datetime('now', '-21 days')`,
    lastSession: `SELECT end_time FROM sleep_sessions 
                  ORDER BY end_time DESC LIMIT 1`
  };

  db.serialize(() => {
    const results = {};
    
    db.get(queries.week1, [], (err, row) => {
      results.week1 = row ? row.avg : 0;
    });
    
    db.get(queries.week2, [], (err, row) => {
      results.week2 = row ? row.avg : 0;
    });
    
    db.get(queries.week3, [], (err, row) => {
      results.week3 = row ? row.avg : 0;
    });
    
    db.get(queries.lastSession, [], (err, row) => {
      results.lastEndTime = row ? row.end_time : null;
      res.json(results);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
