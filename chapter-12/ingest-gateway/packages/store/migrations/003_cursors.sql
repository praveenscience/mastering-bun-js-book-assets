-- How far each forwarder has got, so it resumes after a restart.
CREATE TABLE cursors (
  name TEXT PRIMARY KEY,
  seq  INTEGER NOT NULL
) STRICT;
