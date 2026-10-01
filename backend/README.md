# Backend

Ce dossier contiendra l’API et la logique serveur du produit.

## Responsabilités du backend

Le backend pourra gérer :

- les routes de l’API ;
- la logique métier ;
- la validation des données ;
- l’authentification et l’autorisation ;
- la communication avec PostgreSQL ;
- la gestion des erreurs.

## Organisation prévue

L’organisation interne pourra comprendre :

`src/` : code source ;
`routes/` : routes de l’API ;
`controllers/` : traitement des requêtes ;
`services/` : logique métier ;
`models/` : modèles de données ;
`middlewares/` : middlewares ;
`config/` : configuration de l’application.

## Variables d’environnement

Les variables sensibles doivent être placées dans un fichier `.env` local et ne doivent jamais être ajoutées au dépôt public.

Un exemple de configuration est disponible dans `.env.example`.

## État actuel

Le backend n’est pas encore initialisé.

