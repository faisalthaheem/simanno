const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Create database
const db = new sqlite3.Database('./sample-db/annotations.db');

// Create table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    imheight INTEGER,
    imwidth INTEGER,
    isreviewed INTEGER DEFAULT 0,
    isdeleted INTEGER DEFAULT 0,
    imgareas TEXT,
    labelid INTEGER,
    labeltext TEXT
  )`);
  
  // Insert sample data
  const stmt = db.prepare(`INSERT INTO annotations 
    (filename, imheight, imwidth, isreviewed, imgareas, labelid, labeltext)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
    
  stmt.run('sample1.jpg', 600, 800, 1, '[{"x": 100, "y": 100, "width": 200, "height": 150, "label": 1}]', 1, 'Object');
  stmt.run('sample2.jpg', 400, 600, 0, '[]', null, null);
  stmt.finalize();
});

// Close database
db.close();

console.log('Sample database created successfully');