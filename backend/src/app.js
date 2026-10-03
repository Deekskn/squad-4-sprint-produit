const express = require('express');
const { createProfileRouter } = require('./profile-routes');

function createApp({ pool, authenticate }) {
  if (!pool || typeof pool.query !== 'function') {
    throw new TypeError('Un pool PostgreSQL valide doit être fourni.');
  }
  if (typeof authenticate !== 'function') {
    throw new TypeError('Un middleware authenticate doit être fourni.');
  }

  const app = express();
  app.use(express.json());
  app.use('/api', createProfileRouter(pool, authenticate));
  app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) {
      return next(error);
    }
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  });
  return app;
}

module.exports = { createApp };
