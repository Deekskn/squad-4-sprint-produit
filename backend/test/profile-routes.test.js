const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

const completeProfile = {
  id: 'profile-1',
  displayName: 'Atelier Kofi',
  trade: 'Menuisier',
  phone: '+242060000000',
  description: 'Artisan menuisier, je réalise vos travaux sur mesure.',
  isAdminHidden: false,
  zones: ['Brazzaville'],
  photos: [{ id: 'photo-1', url: 'https://example.com/photo.jpg' }],
};

function createProfileApi(t) {
  const profile = structuredClone(completeProfile);
  const pool = {
    async query(query, values) {
      if (query.includes('FROM profiles p')) {
        return { rows: [structuredClone(profile)] };
      }
      if (query.includes('DELETE FROM profile_photos')) {
        const index = profile.photos.findIndex((photo) => photo.id === values[1]);
        if (index < 0) {
          return { rows: [] };
        }
        const [photo] = profile.photos.splice(index, 1);
        return { rows: [{ id: photo.id }] };
      }
      throw new Error(`Requête pool inattendue : ${query}`);
    },
    async connect() {
      return {
        async query(query, values) {
          if (query === 'BEGIN' || query === 'COMMIT' || query === 'ROLLBACK') {
            return { rows: [] };
          }
          if (query.includes('INSERT INTO profiles')) {
            const [
              ,
              hasDisplayName, displayName,
              hasTrade, trade,
              hasPhone, phone,
              hasDescription, description,
            ] = values;
            if (hasDisplayName) profile.displayName = displayName;
            if (hasTrade) profile.trade = trade;
            if (hasPhone) profile.phone = phone;
            if (hasDescription) profile.description = description;
            return { rows: [{ id: profile.id }] };
          }
          if (query.includes('DELETE FROM profile_zones')) {
            profile.zones = [];
            return { rows: [] };
          }
          if (query.includes('INSERT INTO profile_zones')) {
            profile.zones.push(values[1]);
            return { rows: [] };
          }
          throw new Error(`Requête transaction inattendue : ${query}`);
        },
        release() {},
      };
    },
  };
  const authenticate = (req, res, next) => {
    req.user = { id: 'owner-1' };
    next();
  };
  const server = createApp({ pool, authenticate }).listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  return new Promise((resolve) => {
    server.once('listening', () => {
      resolve({
        profile,
        patch: (body) => fetch(
          `http://127.0.0.1:${server.address().port}/api/me/profile`,
          {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          },
        ),
        deletePhoto: (id) => fetch(
          `http://127.0.0.1:${server.address().port}/api/me/profile/photos/${id}`,
          { method: 'DELETE' },
        ),
      });
    });
  });
}

test('la suppression de la dernière photo retourne le statut incomplet recalculé', async (t) => {
  let photoExists = true;
  const profileId = 'profile-1';
  const pool = {
    async query(query) {
      if (query.includes('DELETE FROM profile_photos')) {
        photoExists = false;
        return { rows: [{ id: 'photo-1' }] };
      }
      if (query.includes('FROM profiles p')) {
        return {
          rows: [{
            id: profileId,
            displayName: 'Atelier Kofi',
            trade: 'Menuisier',
            phone: '+242060000000',
            description: 'Artisan menuisier, je réalise vos travaux sur mesure.',
            isAdminHidden: false,
            zones: ['Brazzaville'],
            photos: photoExists ? [{ id: 'photo-1', url: 'https://example.com/photo.jpg' }] : [],
          }],
        };
      }
      throw new Error(`Requête inattendue : ${query}`);
    },
  };
  const authenticate = (req, res, next) => {
    req.user = { id: 'owner-1' };
    next();
  };
  const server = createApp({ pool, authenticate }).listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/me/profile/photos/photo-1`,
    { method: 'DELETE' },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'Incomplet',
    missingRequirements: [{ field: 'photos', label: 'Au moins une photo' }],
  });
});

test('effacer chacun des éléments obligatoires fait repasser le profil à incomplet', async (t) => {
  const cases = [
    { label: 'nom affiché', body: { displayName: null }, field: 'displayName' },
    { label: 'métier', body: { trade: null }, field: 'trade' },
    { label: 'téléphone', body: { phone: null }, field: 'phone' },
    { label: 'description', body: { description: null }, field: 'description' },
    { label: 'dernière zone', body: { zones: [] }, field: 'zones' },
  ];

  for (const { label, body, field } of cases) {
    await t.test(label, async (subtest) => {
      const api = await createProfileApi(subtest);
      const response = await api.patch(body);

      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.status, 'Incomplet');
      assert.deepEqual(result.missingRequirements.map((item) => item.field), [field]);
    });
  }
});

test('effacer la dernière photo par la route dédiée fait repasser le profil à incomplet', async (t) => {
  const api = await createProfileApi(t);
  const response = await api.deletePhoto('photo-1');

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'Incomplet',
    missingRequirements: [{ field: 'photos', label: 'Au moins une photo' }],
  });
});

test('rejette une requête « Mon profil » non authentifiée', async (t) => {
  const pool = { query: async () => ({ rows: [] }) };
  const authenticate = (req, res, next) => res.sendStatus(401);
  const server = createApp({ pool, authenticate }).listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/me/profile/status`);
  assert.equal(response.status, 401);
});

test('la recherche publique reste accessible sans authentification', async (t) => {
  const pool = { query: async () => ({ rows: [] }) };
  const authenticate = (req, res, next) => res.sendStatus(401);
  const server = createApp({ pool, authenticate }).listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/profiles/search`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});
