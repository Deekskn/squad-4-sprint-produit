CREATE TABLE administrateur (
    id_admin SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(9) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE client (
    id_client SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(9) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE professionnel (
    id_pro SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(9) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    metier VARCHAR(100) NOT NULL,
    descript VARCHAR(500),
    annees_experience VARCHAR(100),
    whatsapp VARCHAR(9),
    masque BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE professionnel_zone (
    id_pro INTEGER NOT NULL
        REFERENCES professionnel(id_pro) ON DELETE CASCADE,
    zone VARCHAR(50) NOT NULL
        CHECK (zone IN (
            'Makélékélé',
            'Bacongo',
            'Poto-Poto',
            'Moungali',
            'Ouenzé',
            'Talangaï',
            'Mfilou',
            'Madibou',
            'Djiri'
        )),
    PRIMARY KEY (id_pro, zone)
);

CREATE TABLE photo (
    id_photo SERIAL PRIMARY KEY,
    fichier VARCHAR(255) NOT NULL,
    miniature VARCHAR(255) NOT NULL,
    legende VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    id_pro INTEGER NOT NULL
        REFERENCES professionnel(id_pro) ON DELETE CASCADE
);

CREATE INDEX idx_photo_pro ON photo(id_pro);
CREATE INDEX idx_professionnel_metier ON professionnel(metier);
CREATE INDEX idx_professionnel_zone_zone ON professionnel_zone(zone);

CREATE VIEW profil_publie AS
SELECT
    p.id_pro,
    p.nom,
    p.prenom,
    p.metier,
    p.descript,
    p.annees_experience,
    p.created_at
FROM professionnel p
WHERE p.masque = FALSE
  AND p.descript IS NOT NULL
  AND CHAR_LENGTH(TRIM(p.descript)) >= 30
  AND EXISTS (SELECT 1 FROM photo ph WHERE ph.id_pro = p.id_pro)
  AND EXISTS (SELECT 1 FROM professionnel_zone pz WHERE pz.id_pro = p.id_pro);