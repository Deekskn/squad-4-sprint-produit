# Database

Schéma PostgreSQL de l’API KOPE.

## Migration US-06

Appliquer `migrations/001_create_profiles.sql` à une base PostgreSQL 13 ou plus récente. Cette migration crée :

- `profiles` : profil de l’artisan et indicateur `is_admin_hidden` ;
- `profile_zones` : zones d’intervention ;
- `profile_photos` : références URL des photos.

`profiles.owner_id` est l’identifiant UUID unique fourni par le système d’authentification ; la table des utilisateurs n’est pas créée ici. La suppression d’un profil supprime ses zones et photos grâce aux clés étrangères. Le système d’administration doit positionner `is_admin_hidden` pour masquer un profil ; les recherches publiques l’excluent.
