const test = require('node:test');
const assert = require('node:assert/strict');
const { getProfileStatus } = require('../src/profile-status');

const completeProfile = {
  displayName: 'Atelier Kofi',
  trade: 'Menuisier',
  phone: '+242060000000',
  description: 'Artisan menuisier, je réalise vos travaux sur mesure.',
  zones: ['Brazzaville'],
  photos: [{ url: 'https://example.com/photo.jpg' }],
  isAdminHidden: false,
};

test('publie un profil qui satisfait toutes les conditions RG-04', () => {
  assert.deepEqual(getProfileStatus(completeProfile), {
    status: 'Publié',
    missingRequirements: [],
  });
});

test('retourne précisément les champs manquants pour un profil vide', () => {
  const result = getProfileStatus({
    displayName: ' ',
    trade: null,
    phone: '',
    description: 'Trop court',
    zones: [],
    photos: [],
    isAdminHidden: false,
  });

  assert.equal(result.status, 'Incomplet');
  assert.deepEqual(result.missingRequirements.map(({ field }) => field), [
    'displayName',
    'trade',
    'zones',
    'phone',
    'description',
    'photos',
  ]);
});

test('accepte une description de 30 caractères et une photo unique', () => {
  assert.equal(
    getProfileStatus({
      ...completeProfile,
      description: 'é'.repeat(30),
      photos: [{ url: 'https://example.com/photo.jpg' }],
    }).status,
    'Publié',
  );
});

test('redevient incomplet après la suppression de la dernière photo', () => {
  const result = getProfileStatus({ ...completeProfile, photos: [] });
  assert.equal(result.status, 'Incomplet');
  assert.deepEqual(result.missingRequirements, [
    { field: 'photos', label: 'Au moins une photo' },
  ]);
});

test('un profil masqué est signalé masqué indépendamment de sa complétude', () => {
  const result = getProfileStatus({ ...completeProfile, isAdminHidden: true });
  assert.equal(result.status, 'Masqué');
  assert.deepEqual(result.missingRequirements, []);
});
