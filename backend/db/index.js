const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const dbType = process.env.DB_TYPE || 'sqlite';
let pool = null;
let sqliteDb = null;

const initDb = () => {
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      console.log('Database configuration: PostgreSQL');
      const config = process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'events_db',
          };

      pool = new Pool(config);

      // Verify connection and run migrations
      pool.query('SELECT NOW()', (err, res) => {
        if (err) {
          console.error('PostgreSQL connection error:', err);
          return reject(err);
        }
        console.log('PostgreSQL connected successfully.');
        
        // Load and execute schema
        try {
          const schemaPath = path.join(__dirname, 'schema.sql');
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');
          pool.query(schemaSql, (err) => {
            if (err) {
              console.error('PostgreSQL schema migration error:', err);
              return reject(err);
            }
            console.log('PostgreSQL schema migrated successfully.');
            resolve();
          });
        } catch (schemaErr) {
          reject(schemaErr);
        }
      });

    } else {
      console.log('Database configuration: SQLite');
      const dbPath = path.join(__dirname, '../database.sqlite');
      const dbExists = fs.existsSync(dbPath);

      sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('SQLite connection error:', err);
          return reject(err);
        }
        console.log(`SQLite connected successfully at: ${dbPath}`);

        // Enable foreign keys
        sqliteDb.run('PRAGMA foreign_keys = ON;', (err) => {
          if (err) console.error('Error enabling foreign keys for SQLite:', err);
        });

        // Run migrations
        try {
          const schemaPath = path.join(__dirname, 'sqlite_schema.sql');
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');
          sqliteDb.exec(schemaSql, (err) => {
            if (err) {
              console.error('SQLite schema migration error:', err);
              return reject(err);
            }
            console.log('SQLite schema migrated successfully.');
            resolve();
          });
        } catch (schemaErr) {
          reject(schemaErr);
        }
      });
    }
  });
};

const query = (text, params = []) => {
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      pool.query(text, params, (err, res) => {
        if (err) return reject(err);
        resolve({
          rows: res.rows || [],
          rowCount: res.rowCount || 0,
        });
      });
    } else {
      // Translate Postgres parameters ($1, $2, etc.) to SQLite (?)
      const sqliteText = text.replace(/\$\d+/g, '?');
      
      // Determine if this is a query that returns rows (SELECT or queries with RETURNING)
      const normalizedSql = sqliteText.trim().toLowerCase();
      const isSelect = normalizedSql.startsWith('select') || normalizedSql.includes('returning');

      if (isSelect) {
        sqliteDb.all(sqliteText, params, (err, rows) => {
          if (err) return reject(err);
          resolve({
            rows: rows || [],
            rowCount: rows ? rows.length : 0,
          });
        });
      } else {
        sqliteDb.run(sqliteText, params, function (err) {
          if (err) return reject(err);
          resolve({
            rows: [],
            rowCount: this.changes,
            lastID: this.lastID,
          });
        });
      }
    }
  });
};

module.exports = {
  initDb,
  query,
  dbType,
};
