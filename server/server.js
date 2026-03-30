const express = require('express');
const sqlite = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

const dbPath = `C:/Users/97252/Desktop/apartments_scraper_project/apartments_rent_app/scraper/apartments.db`;
const db = sqlite(dbPath);

console.log('DB path:', dbPath);
console.log('File exists:', fs.existsSync(dbPath));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in DB:', tables);

const count = db.prepare('SELECT COUNT(*) as count FROM apartments').get();
console.log('Row count:', count);

const sample = db.prepare('SELECT * FROM apartments LIMIT 1').get();
console.log('Sample row:', sample);

app.use(cors());

app.get('/api/apartments', (req, res) => {
    console.log('Route hit!');
    try {
        const rows = db.prepare('SELECT * FROM apartments').all();
        res.json(rows);
    } catch (error) {
        console.error('FULL ERROR:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(5000, () => {
    console.log('Server running on http://localhost:5000/api/apartments');
    console.log('Connected to database at:', dbPath);
});