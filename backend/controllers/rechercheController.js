const pool = require('../config/database');

async function rechercher(req, res) {
  const mot = (req.query.q || '').trim();

  if (!mot) {
    return res.status(400).json({ message: 'Mot non spécifié' });
  }

  try {
    const motif = `%${mot}%`;
    const requete = `
      SELECT * FROM profil_publie
      WHERE metier ILIKE $1
      LIMIT 20
    `;
    const resultat = await pool.query(requete, [motif]);
    res.json(resultat.rows);
  } catch (erreur) {
    console.error(erreur);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
}

module.exports = { rechercher };