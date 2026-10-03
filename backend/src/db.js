const { Pool } = require('pg');

function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('La variable DATABASE_URL est obligatoire pour se connecter à PostgreSQL.');
  }
  return new Pool({ connectionString });
}

module.exports = { createPool };
