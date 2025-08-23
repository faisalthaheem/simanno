const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { loadConfig } = require('./config');

class DatabaseManager {
  constructor() {
    this.dbconns = {};
    this.dbcursors = {};
  }

  loadSqliteDbs() {
    const config = loadConfig();
    const sqlitedbs = config.anno.dbs.split(',');
    
    console.log('Instantiating sqlite dbs');
    
    for (const dbPath of sqlitedbs) {
      console.log(`Opening database ${dbPath}`);
      
      if (fs.existsSync(dbPath)) {
        const db = new sqlite3.Database(dbPath);
        this.dbconns[dbPath] = db;
        this.dbcursors[dbPath] = db;
        console.log(`Database [${dbPath}] opened`);
      } else {
        console.warn(`Database [${dbPath}] does not exist, skipping`);
        this.dbcursors[dbPath] = null;
        this.dbconns[dbPath] = null;
      }
    }
    
    console.log('DBs opened');
  }

  closeDbs() {
    console.log('Closing dbs');
    
    for (const dbPath in this.dbconns) {
      if (this.dbconns[dbPath]) {
        this.dbconns[dbPath].close();
      }
    }
    
    console.log('DBs closed');
  }

  // Add a method to refresh database connections
  refreshDbs() {
    console.log('Refreshing database connections');
    this.closeDbs();
    this.dbconns = {};
    this.dbcursors = {};
    this.loadSqliteDbs();
    console.log('Database connections refreshed');
  }

  // Add a method to check if a database connection is still valid
  isDbValid(dbPath) {
    const db = this.dbcursors[dbPath];
    return db !== null && db !== undefined;
  }

  // Add a method to get a valid database connection
  getDbConnection(dbPath) {
    if (this.isDbValid(dbPath)) {
      return this.dbcursors[dbPath];
    }
    return null;
  }

  lookupFile(filename, checkReviewed = true) {
    return new Promise((resolve, reject) => {
      const config = loadConfig();
      const sqlitedbs = config.anno.dbs.split(',');
      
      let found = false;
      
      for (const dbPath of sqlitedbs) {
        const db = this.dbcursors[dbPath];
        if (db) {
          // Look up plate information for the requested name
          let query;
          if (checkReviewed) {
            query = `SELECT imheight,imwidth,imgareas FROM annotations WHERE isdeleted = 0 AND filename = ? AND isreviewed = 0`;
          } else {
            query = `SELECT imheight,imwidth,imgareas FROM annotations WHERE isdeleted = 0 AND filename = ?`;
          }
          
          db.get(query, [filename], (err, row) => {
            if (err) {
              reject(err);
            } else if (row && !found) {
              found = true;
              resolve({
                imheight: row.imheight,
                imwidth: row.imwidth,
                imgareas: row.imgareas,
                dbName: dbPath
              });
            }
          });
        }
      }
      
      // If not found in any database
      if (!found) {
        setTimeout(() => resolve({ imheight: null, imwidth: null, imgareas: null, dbName: null }), 0);
      }
    });
  }

  updateFile(dbPath, filename, coords) {
    return new Promise((resolve, reject) => {
      const db = this.getDbConnection(dbPath);
      if (!db) {
        reject(new Error('Database connection not available'));
        return;
      }
      
      // Look up plate information for the requested name
      const query = `UPDATE annotations set imgareas=?, isreviewed = 1 where filename = ?`;
      
      db.run(query, [coords, filename], function(err) {
        if (err) {
          console.error('Database update error:', err);
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  updateLabel(dbPath, filename, labelid, labeltext) {
    return new Promise((resolve, reject) => {
      const db = this.getDbConnection(dbPath);
      if (!db) {
        reject(new Error('Database connection not available'));
        return;
      }
      
      // Update label information for the file
      const query = `UPDATE annotations set labelid=?, labeltext=? where filename = ?`;
      
      db.run(query, [labelid, labeltext, filename], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  insertFile(dbPath, filename, coords, imwidth, imheight) {
    return new Promise((resolve, reject) => {
      const db = this.getDbConnection(dbPath);
      if (!db) {
        reject(new Error('Database connection not available'));
        return;
      }
      
      // Insert new information
      const query = `INSERT INTO annotations(filename, imheight, imwidth, isreviewed, imgareas) values(?,?,?,?,?)`;
      
      db.run(query, [filename, imheight, imwidth, 1, coords], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  getLabels() {
    const config = loadConfig();
    return {
      available: config.labels.list,
      default: {
        [config.labels.default]: config.labels.list[config.labels.default]
      }
    };
  }
}

const dbManager = new DatabaseManager();

// Initialize databases when module is loaded
dbManager.loadSqliteDbs();

module.exports = dbManager;
