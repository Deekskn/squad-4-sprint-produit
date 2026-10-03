const REQUIREMENTS = [
  {
    field: 'displayName',
    label: 'Nom affiché',
    isMissing: (profile) => !profile.displayName?.trim(),
  },
  {
    field: 'trade',
    label: 'Métier',
    isMissing: (profile) => !profile.trade?.trim(),
  },
  {
    field: 'zones',
    label: 'Au moins une zone d’intervention',
    isMissing: (profile) => (profile.zones?.length ?? profile.zoneCount ?? 0) < 1,
  },
  {
    field: 'phone',
    label: 'Téléphone',
    isMissing: (profile) => !profile.phone?.trim(),
  },
  {
    field: 'description',
    label: 'Description d’au moins 30 caractères',
    isMissing: (profile) => Array.from(profile.description?.trim() ?? '').length < 30,
  },
  {
    field: 'photos',
    label: 'Au moins une photo',
    isMissing: (profile) => (profile.photos?.length ?? profile.photoCount ?? 0) < 1,
  },
];

function getProfileStatus(profile) {
  const missingRequirements = REQUIREMENTS
    .filter((requirement) => requirement.isMissing(profile))
    .map(({ field, label }) => ({ field, label }));

  return {
    status: profile.isAdminHidden
      ? 'Masqué'
      : missingRequirements.length === 0
        ? 'Publié'
        : 'Incomplet',
    missingRequirements,
  };
}

module.exports = { getProfileStatus };
