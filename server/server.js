const express = require('express'); //the server
const sqlite = require('better-sqlite3'); //allows acssesing the db
const cors = require('cors'); //Cross-Origin Resource Sharing - allows the server to indicate any origins (domain, scheme, or port) 
const path = require('path'); //validate path through pc, linux, etc
const fs = require('fs'); //allows look at my hard drive

const app = express();

const dbPath = `C:/Users/97252/Desktop/apartments_scraper_project/apartments_rent_app/scraper/apartments.db`;
const db = sqlite(dbPath);

console.log('DB path:', dbPath);
console.log('File exists:', fs.existsSync(dbPath));

//db.prepare compile the querry, all() takes any row that match (array) and get() single row (object)
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all(); //check all tables to see if is the database structure correct
console.log('Tables in DB:', tables);

const count = db.prepare('SELECT COUNT(*) as count FROM apartments').get(); //check if we have data at the table
console.log('Row count:', count);

const sample = db.prepare('SELECT * FROM apartments LIMIT 1').get(); //check how the data looks
console.log('Sample row:', sample);

app.use(cors()); //tells the server use cors policy, preventing "blocked by CORS" errors in the browser

app.get('/api/apartments', (req, res) => { //the function takes 2 param, path and callback
    console.log('Route hit!');
    //makes json of the results
    try { 
        const rows = db.prepare('SELECT * FROM apartments').all(); 
        res.json(rows);
    } catch (error) {
        console.error('FULL ERROR:', error);
        res.status(500).json({ error: error.message }); //internal server error
    }
});

app.listen(5000, () => {
    console.log('Server running on http://localhost:5000/api/apartments');
    console.log('Connected to database at:', dbPath);
});

//db (SQLite): Moves data from Disk to Server Memory.
//res (Express): Moves data from Server Memory to Client Browser.
