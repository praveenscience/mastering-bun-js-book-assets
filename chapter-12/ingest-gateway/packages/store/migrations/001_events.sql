-- seq is the arrival order and the forwarder's cursor. A producer's
-- own id is unique per key, so a retried event is stored once.
CREATE TABLE events (
  seq         INTEGER PRIMARY KEY,
  key_id      INTEGER NOT NULL,
  event_id    TEXT    NOT NULL,
  received_at INTEGER NOT NULL,
  ts          INTEGER NOT NULL,
  type        TEXT    NOT NULL,
  user_id     TEXT    NOT NULL,
  ms          INTEGER,
  props       TEXT,
  UNIQUE (key_id, event_id)
) STRICT;

CREATE INDEX events_ts_type ON events (ts, type);
CREATE INDEX events_received ON events (received_at);
