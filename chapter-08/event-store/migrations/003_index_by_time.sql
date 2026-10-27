-- The dashboard filters by time first, so the time column must lead.
-- EXPLAIN QUERY PLAN showed that (type, ts) scanned the whole index.
DROP INDEX events_type_ts;
CREATE INDEX events_ts_type ON events (ts, type);
