const express = require('express');
const db = require('./db');
const app = express();
const PORT = 3000;

// Middleware to serve static files and handle JSON
app.use(express.static('public'));
app.use(express.json());

// API endpoint to get sleep data
app.get('/api/sleep', (req, res) => {
  db.all(`
    SELECT 
      id,
      datetime(sleep_start) as sleep_start,
      datetime(wake_up) as wake_up,
      duration
    FROM sleep 
    ORDER BY wake_up DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch sleep records' });
    }
    res.json(rows);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});