const express = require('express');
const { getProfileStatus } = require('./profile-status');

const PROFILE_QUERY = `
  SELECT
    p.id,
    p.display_name AS "displayName",
    p.trade,
    p.phone,
    p.description,
    p.is_admin_hidden AS "isAdminHidden",
    COALESCE(
      (SELECT json_agg(z.zone ORDER BY z.zone) FROM profile_zones z WHERE z.profile_id = p.id),
      '[]'::json
    ) AS zones,
    COALESCE(
      (SELECT json_agg(json_build_object('id', photo.id, 'url', photo.url) ORDER BY photo.created_at)
       FROM profile_photos photo WHERE photo.profile_id = p.id),
      '[]'::json
    ) AS photos
  FROM profiles p
  WHERE p.owner_id = $1
`;

function requireOwner(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }
  next();
}

function validateProfileUpdate(body) {
  const allowedFields = ['displayName', 'trade', 'phone', 'description'];
  for (const field of allowedFields) {
    if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
      return `Le champ « ${field} » doit être une chaîne de caractères ou null.`;
    }
  }

  if (body.zones !== undefined) {
    if (body.zones !== null
      && (!Array.isArray(body.zones) || body.zones.some((zone) => typeof zone !== 'string' || !zone.trim()))) {
      return 'Le champ « zones » doit être un tableau de zones non vides ou null.';
    }
  }

  return null;
}

function createProfileRouter(pool, authenticate) {
  const router = express.Router();
  router.use('/me', authenticate, requireOwner);

  router.get('/me/profile/status', async (req, res, next) => {
    try {
      const result = await pool.query(PROFILE_QUERY, [req.user.id]);
      const profile = result.rows[0] ?? {
        displayName: null,
        trade: null,
        phone: null,
        description: null,
        zones: [],
        photos: [],
        isAdminHidden: false,
      };
      res.json(getProfileStatus(profile));
    } catch (error) {
      next(error);
    }
  });

  router.get('/me/profile', async (req, res, next) => {
    try {
      const result = await pool.query(PROFILE_QUERY, [req.user.id]);
      if (!result.rows[0]) {
        return res.json({
          profile: null,
          ...getProfileStatus({
            displayName: null,
            trade: null,
            phone: null,
            description: null,
            zones: [],
            photos: [],
            isAdminHidden: false,
          }),
        });
      }
      res.json({ profile: result.rows[0], ...getProfileStatus(result.rows[0]) });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/me/profile', async (req, res, next) => {
    const body = req.body ?? {};
    const validationError = validateProfileUpdate(body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { displayName, trade, phone, description } = body;
      const updated = await client.query(
        `INSERT INTO profiles (owner_id, display_name, trade, phone, description)
         VALUES ($1, $3, $5, $7, $9)
         ON CONFLICT (owner_id) DO UPDATE SET
           display_name = CASE WHEN $2 THEN $3 ELSE profiles.display_name END,
           trade = CASE WHEN $4 THEN $5 ELSE profiles.trade END,
           phone = CASE WHEN $6 THEN $7 ELSE profiles.phone END,
           description = CASE WHEN $8 THEN $9 ELSE profiles.description END,
           updated_at = now()
         RETURNING id`,
        [
          req.user.id,
          displayName !== undefined,
          displayName ?? null,
          trade !== undefined,
          trade ?? null,
          phone !== undefined,
          phone ?? null,
          description !== undefined,
          description ?? null,
        ],
      );

      if (body.zones !== undefined) {
        await client.query('DELETE FROM profile_zones WHERE profile_id = $1', [updated.rows[0].id]);
        for (const zone of [...new Set((body.zones ?? []).map((value) => value.trim()))]) {
          await client.query(
            'INSERT INTO profile_zones (profile_id, zone) VALUES ($1, $2)',
            [updated.rows[0].id, zone],
          );
        }
      }

      await client.query('COMMIT');
      const result = await pool.query(PROFILE_QUERY, [req.user.id]);
      res.json({ profile: result.rows[0], ...getProfileStatus(result.rows[0]) });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  });

  router.post('/me/profile/photos', async (req, res, next) => {
    const url = req.body?.url;
    if (typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Le champ « url » de la photo est obligatoire.' });
    }
    try {
      const result = await pool.query(
        `INSERT INTO profile_photos (profile_id, url)
         SELECT id, $2 FROM profiles WHERE owner_id = $1
         RETURNING id, url`,
        [req.user.id, url.trim()],
      );
      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Profil introuvable. Enregistrez d’abord votre profil.' });
      }
      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/me/profile/photos/:photoId', async (req, res, next) => {
    try {
      const deleted = await pool.query(
        `DELETE FROM profile_photos photo
         USING profiles profile
         WHERE photo.profile_id = profile.id
           AND profile.owner_id = $1
           AND photo.id = $2
         RETURNING photo.id`,
        [req.user.id, req.params.photoId],
      );
      if (!deleted.rows[0]) {
        return res.status(404).json({ error: 'Photo introuvable.' });
      }

      const result = await pool.query(PROFILE_QUERY, [req.user.id]);
      res.json(getProfileStatus(result.rows[0]));
    } catch (error) {
      next(error);
    }
  });

  router.get('/profiles/search', async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT p.id, p.display_name AS "displayName", p.trade, p.phone, p.description,
                COALESCE(
                  (SELECT json_agg(z.zone ORDER BY z.zone) FROM profile_zones z WHERE z.profile_id = p.id),
                  '[]'::json
                ) AS zones,
                COALESCE(
                  (SELECT json_agg(photo.url ORDER BY photo.created_at)
                   FROM profile_photos photo WHERE photo.profile_id = p.id),
                  '[]'::json
                ) AS photos
         FROM profiles p
         WHERE p.is_admin_hidden = false
           AND NULLIF(btrim(p.display_name), '') IS NOT NULL
           AND NULLIF(btrim(p.trade), '') IS NOT NULL
           AND NULLIF(btrim(p.phone), '') IS NOT NULL
           AND char_length(btrim(p.description)) >= 30
           AND EXISTS (SELECT 1 FROM profile_zones z WHERE z.profile_id = p.id)
           AND EXISTS (SELECT 1 FROM profile_photos photo WHERE photo.profile_id = p.id)
         ORDER BY p.updated_at DESC`,
      );
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createProfileRouter };
