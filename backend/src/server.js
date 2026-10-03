require('dotenv').config();

const { createApp } = require('./app');
const { createPool } = require('./db');

const PORT = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('PORT doit être un numéro de port valide entre 1 et 65535.');
}

async function startServer() {
  const pool = createPool();

  try {
    await pool.query('SELECT 1');
    console.log('Connexion à PostgreSQL vérifiée.');

    const app = createApp({
      pool,
      authenticate: (req, res, next) => next(),
    });
    const server = app.listen(PORT, () => {
      console.log(`API KOPE démarrée sur le port ${PORT}.`);
    });

    const shutdown = () => {
      server.close(async (error) => {
        try {
          await pool.end();
        } catch (poolError) {
          console.error('Erreur lors de la fermeture du pool PostgreSQL :', poolError.message);
          process.exitCode = 1;
        }

        if (error) {
          console.error('Erreur lors de l’arrêt du serveur :', error.message);
          process.exitCode = 1;
        }
      });
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  } catch (error) {
    await pool.end();
    throw error;
  }
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Impossible de démarrer le backend :', error.message);
    process.exitCode = 1;
  });
}

module.exports = { startServer };
