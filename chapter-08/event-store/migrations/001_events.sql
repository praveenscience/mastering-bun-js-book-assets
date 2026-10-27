CREATE TABLE events (
  id      INTEGER PRIMARY KEY,
  ts      INTEGER NOT NULL,          -- milliseconds since 1970
  type    TEXT    NOT NULL,
  user_id TEXT    NOT NULL,
  ms      INTEGER NOT NULL CHECK (ms >= 0),
  payload TEXT                       -- optional JSON
) STRICT;

CREATE INDEX events_type_ts ON events (type, ts);
