# Backend

API Node.js/Express avec PostgreSQL pour le profil professionnel (US-06).

## Prérequis et configuration

- Node.js 20 ou plus récent ;
- PostgreSQL ;
- `DATABASE_URL`, sous la forme `postgresql://utilisateur:motdepasse@hote:5432/base`.

Depuis ce dossier, installez les dépendances avec `npm install`. Créez un fichier `.env` contenant `DATABASE_URL=postgresql://utilisateur:motdepasse@hote:5432/base` et, facultativement, `PORT=3000`. Lancez `npm start` : le serveur vérifie d’abord la connexion avec PostgreSQL (`SELECT 1`) et ne démarre l’API qu’en cas de succès. Appliquez ensuite le script [001_create_profiles.sql](../database/migrations/001_create_profiles.sql) à la base configurée.

L’application est exposée par `createApp({ pool, authenticate })` dans `src/app.js`. Fournissez le pool `pg` et le middleware d’authentification du produit ; celui-ci doit fournir l’identifiant UUID de l’artisan dans `req.user.id`. Le point d’entrée de développement ne fournit pas d’authentification : les routes « Mon profil » refusent donc les requêtes non authentifiées. L’identifiant de propriétaire référence l’identité du système d’authentification et n’ajoute pas de table utilisateurs.

## Routes

Toutes les routes sont préfixées par `/api`.

| Méthode | Route | Fonction |
|---|---|---|
| GET | `/me/profile` | Retourne le profil, son statut et les éléments manquants |
| GET | `/me/profile/status` | Retourne le statut et la liste des éléments manquants |
| PATCH | `/me/profile` | Crée ou met à jour les champs transmis ; `null` efface un champ et `zones`, si fourni, remplace la liste (`null` ou `[]` l’efface) |
| POST | `/me/profile/photos` | Ajoute une photo avec `{ "url": "..." }` |
| DELETE | `/me/profile/photos/:photoId` | Supprime une photo appartenant à l’artisan et recalcule immédiatement son statut |
| GET | `/profiles/search` | Retourne seulement les profils complets non masqués par l’administration |

Le statut est calculé à la lecture depuis les données courantes. Il vaut `Publié` si le nom affiché, le métier, une zone, le téléphone, une description d’au moins 30 caractères et une photo sont présents ; sinon il vaut `Incomplet`. Un profil masqué par l’administration a le statut `Masqué` et n’est pas retourné par la recherche. Les éléments manquants sont des objets `{ field, label }`.

## Tests

Exécutez `npm test` pour lancer les tests unitaires de la règle de publication.
