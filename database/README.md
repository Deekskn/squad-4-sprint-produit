# Database

Ce dossier contiendra les éléments liés à la base de données PostgreSQL.

## Éléments prévus

Il pourra contenir :

- les scripts SQL ;
- les schémas de tables ;
- les migrations ;
- les données de test ;
- la documentation de la structure des données.

# Travail effectuer par MOUYEDI 

## Documentation de la structure des données : 


## Technologies utilisées

### Base de données

* PostgreSQL
* `SERIAL` pour les identifiants auto-incrémentés
* `TIMESTAMPTZ` pour les dates
* Clés primaires et étrangères
* Contraintes `UNIQUE`
* Contraintes `CHECK`
* Index PostgreSQL
* Vue SQL (`VIEW`)

---

#  Structure de la base de données

La base de données contient les principales entités suivantes :

* `administrateur`
* `client`
* `professionnel`
* `professionnel_zone`
* `photo`
* `profil_publie` — vue SQL

---

##  Table `administrateur`

Cette table contient les comptes administrateurs de la plateforme.

| Colonne             | Type         | Description                |
| ------------------- | ------------ | -------------------------- |
| `id_admin`          | SERIAL       | Identifiant unique         |
| `nom`               | VARCHAR(100) | Nom de l'administrateur    |
| `prenom`            | VARCHAR(100) | Prénom                     |
| `telephone`         | VARCHAR(9)   | Numéro de téléphone unique |
| `mot_de_passe_hash` | VARCHAR(255) | Mot de passe hashé         |
| `created_at`        | TIMESTAMPTZ  | Date de création           |

### Contraintes

* `id_admin` est la clé primaire.
* `telephone` est unique.
* `nom`, `prenom`, `telephone` et `mot_de_passe_hash` sont obligatoires.

---

## Table `client`

Cette table contient les utilisateurs qui utilisent la plateforme en tant que clients.

| Colonne             | Type         | Description                |
| ------------------- | ------------ | -------------------------- |
| `id_client`         | SERIAL       | Identifiant unique         |
| `nom`               | VARCHAR(100) | Nom du client              |
| `prenom`            | VARCHAR(100) | Prénom du client           |
| `telephone`         | VARCHAR(9)   | Numéro de téléphone unique |
| `mot_de_passe_hash` | VARCHAR(255) | Mot de passe hashé         |
| `created_at`        | TIMESTAMPTZ  | Date de création           |

### Contraintes

* `id_client` est la clé primaire.
* `telephone` est unique.
* Les informations principales sont obligatoires.

---

# Table `professionnel`

Cette table contient les profils des professionnels disponibles sur la plateforme.

| Colonne             | Type         | Description                     |
| ------------------- | ------------ | ------------------------------- |
| `id_pro`            | SERIAL       | Identifiant unique              |
| `nom`               | VARCHAR(100) | Nom du professionnel            |
| `prenom`            | VARCHAR(100) | Prénom                          |
| `telephone`         | VARCHAR(9)   | Numéro de téléphone unique      |
| `mot_de_passe_hash` | VARCHAR(255) | Mot de passe hashé              |
| `metier`            | VARCHAR(100) | Métier exercé                   |
| `descript`          | VARCHAR(500) | Description du professionnel    |
| `annees_experience` | VARCHAR(100) | Expérience professionnelle      |
| `whatsapp`          | VARCHAR(9)   | Numéro WhatsApp                 |
| `masque`            | BOOLEAN      | Indique si le profil est masqué |
| `created_at`        | TIMESTAMPTZ  | Date de création                |

N.B: le champ descript c'est juste le champ description je l'ai écris comme ça parce qu'il comprend description comme une de ces fonction pour ne pas avoir un message d'erreur j'ai du l'écrire descript

### Gestion de la visibilité

La colonne :

```sql
masque BOOLEAN NOT NULL DEFAULT FALSE
```

permet de contrôler la visibilité d'un professionnel

* `FALSE` → le profil peut être publié
* `TRUE` → le profil est masqué

---

# Table `professionnel_zone`

Cette table permet d'associer un professionnel à une ou plusieurs zones d'intervention

Un professionnel peut donc travailler dans plusieurs arrondissements

### Zones disponibles

* Makélékélé
* Bacongo
* Poto-Poto
* Moungali
* Ouenzé
* Talangaï
* Mfilou
* Madibou
* Djiri

| Colonne  | Type        | Description                  |
| -------- | ----------- | ---------------------------- |
| `id_pro` | INTEGER     | Identifiant du professionnel |
| `zone`   | VARCHAR(50) | Zone d'intervention          |

La clé primaire est composée de :

```sql
PRIMARY KEY (id_pro, zone)
```

Cela empêche d'enregistrer deux fois la même zone pour un même professionnel.

### Relation

```text
professionnel
      │
      │ 1
      │
      |________ N professionnel_zone
```
ce qui veux dire qu'il peux y avoir plusieurs zones pour un professionel et une zone peux être à un professionel d'où la clé primaire de proffessionnel vas dans professionnel_zone mais cella n'empêche pas que deux différents proffessionnel est la même zone.

La suppression d'un professionnel entraîne automatiquement la suppression de ses zones grâce à :

```sql
ON DELETE CASCADE
```

---

# Table `photo`

Cette table permet d'enregistrer les photos associées aux professionnels.

| Colonne      | Type         | Description                   |
| ------------ | ------------ | ----------------------------- |
| `id_photo`   | SERIAL       | Identifiant unique            |
| `fichier`    | VARCHAR(255) | Chemin ou nom du fichier      |
| `miniature`  | VARCHAR(255) | Chemin ou nom de la miniature |
| `legende`    | VARCHAR(150) | Légende de la photo           |
| `created_at` | TIMESTAMPTZ  | Date d'ajout                  |
| `id_pro`     | INTEGER      | Professionnel associé         |

### Relation

Un professionnel peut posséder plusieurs photos.

```text
professionnel
      │
      │ 1
      │
      |________ N photo
```

La suppression d'un professionnel entraîne automatiquement la suppression de ses photos grâce à :

```sql
ON DELETE CASCADE
```

---

# Index

Plusieurs index ont été créés pour améliorer les recherches.

### Index des photos

```sql
CREATE INDEX idx_photo_pro ON photo(id_pro);
```

Permet d'accélérer la recherche des photos appartenant à un professionnel.

### Index des métiers

```sql
CREATE INDEX idx_professionnel_metier
ON professionnel(metier);
```

Permet d'améliorer les recherches de professionnels par métier.

### Index des zones

```sql
CREATE INDEX idx_professionnel_zone_zone
ON professionnel_zone(zone);
```

Permet d'améliorer les recherches de professionnels par zone d'intervention.

---

# Vue `profil_publie`

La vue `profil_publie` permet de récupérer uniquement les professionnels pouvant être considérés comme ayant un profil suffisamment complet pour être affiché publiquement.

```sql
CREATE VIEW profil_publie AS
...
```

Un professionnel doit respecter plusieurs conditions.

### 1. Le profil ne doit pas être masqué

```sql
p.masque = FALSE
```

### 2. Une description doit être renseignée

La description doit exister et contenir au moins 30 caractères après suppression des espaces inutiles.

### 3. Le professionnel doit avoir au moins une photo

```sql
EXISTS (
    SELECT 1
    FROM photo ph
    WHERE ph.id_pro = p.id_pro
)
```

### 4. Le professionnel doit avoir au moins une zone

```sql
EXISTS (
    SELECT 1
    FROM professionnel_zone pz
    WHERE pz.id_pro = p.id_pro
)
```

Ainsi, la vue permet de récupérer uniquement les profils répondant aux critères de publication.

---

# Relations principales

Le modèle de données peut être représenté ainsi :

```text
                         ┌-----------------┐
                         │  ADMINISTRATEUR │
                         └-----------------┘


┌--------------┐
│    CLIENT    │
└--------------┘


                         ┌-----------------┐
                         │  PROFESSIONNEL  │
                         └-----------------┘
                                  │
                    ┌-------------┼-------------┐
                    │             │             │
                    -             -             -
             ┌------------┐ ┌-----------┐ ┌---------------┐
             │    PHOTO   │ │   ZONES   │ │ profil_publie │
             └------------┘ └-----------┘ └---------------┘
             

#  Sécurité

Les mots de passe ne doivent pas être enregistrés en clair.

Les colonnes :

```text
mot_de_passe_hash
```

doivent contenir uniquement des mots de passe **hachés**.

pour le hacher on vas d'utiliser un système de hash sécurisé côté backend, avec `bcrypt`.

Les numéros de téléphone sont également uniques afin d'éviter plusieurs comptes utilisant le même numéro.

---

# Règles métier principales

La base de données applique notamment les règles suivantes :

1. Un numéro de téléphone ne peut appartenir qu'à un seul compte du même type. (UNIQUE)
2. Un professionnel peut intervenir dans plusieurs zones.
3. Une zone ne peut être enregistrée qu'une seule fois pour un même professionnel.
4. Un professionnel peut posséder plusieurs photos.
5. La suppression d'un professionnel supprime ses zones associées.
6. La suppression d'un professionnel supprime également ses photos associées.
7. Un professionnel masqué n'apparaît pas dans `profil_publie`.
8. Un professionnel doit avoir une description d'au moins 30 caractères pour apparaître dans `profil_publie`.
9. Un professionnel doit avoir au moins une photo.
10. Un professionnel doit avoir au moins une zone d'intervention.

---

# Utilisation de la vue

Pour récupérer les profils publiés :
j'ai écri une requêtte de selection 

```sql
SELECT *
FROM profil_publie;
```

Pour rechercher les professionnels d'un métier donné, il sera possible d'interroger les tables ou de construire des requêtes adaptées à l'application.

---

