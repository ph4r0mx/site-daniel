const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, '../data/db.json');
const CONTENT_PATH = path.join(__dirname, '../data/content.json');

function readDB() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  if (fs.existsSync(CONTENT_PATH)) {
    db.content = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf-8'));
  }
  return db;
}
function writeDB(data) {
  const { content, ...dbOnly } = data;
  fs.writeFileSync(DB_PATH, JSON.stringify(dbOnly, null, 2));
}
module.exports = { readDB, writeDB };
