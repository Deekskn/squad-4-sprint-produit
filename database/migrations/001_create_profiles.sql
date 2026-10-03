CREATE TABLE profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL UNIQUE,
    display_name text,
    trade text,
    phone text,
    description text,
    is_admin_hidden boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profile_zones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    zone text NOT NULL CHECK (length(btrim(zone)) > 0),
    UNIQUE (profile_id, zone)
);

CREATE TABLE profile_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    url text NOT NULL CHECK (length(btrim(url)) > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profile_zones_profile_id_idx ON profile_zones (profile_id);
CREATE INDEX profile_photos_profile_id_idx ON profile_photos (profile_id);
CREATE INDEX profiles_publication_search_idx ON profiles (updated_at DESC)
    WHERE is_admin_hidden = false;
