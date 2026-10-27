-- Only a SHA-256 hash of each key is stored, never the key itself.
CREATE TABLE api_keys (
  id          INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL UNIQUE,
  hash        BLOB    NOT NULL UNIQUE,
  prefix      TEXT    NOT NULL,
  per_second  INTEGER NOT NULL,
  burst       INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  revoked_at  INTEGER
) STRICT;
