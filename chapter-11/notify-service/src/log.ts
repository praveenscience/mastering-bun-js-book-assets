// Structured logs: one JSON object per line on stdout, so the
// platform can collect them and a log store can search fields.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
export type Level = keyof typeof LEVELS;
export type Fields = Record<string, unknown>;

export function createLogger(min: Level, base: Fields = {}) {
  const write = (level: Level, msg: string, fields?: Fields) => {
    if (LEVELS[level] < LEVELS[min]) return;
    const line = { time: new Date().toISOString(), level, msg };
    console.log(JSON.stringify({ ...line, ...base, ...fields }));
  };
  return {
    debug: (msg: string, f?: Fields) => write("debug", msg, f),
    info: (msg: string, f?: Fields) => write("info", msg, f),
    warn: (msg: string, f?: Fields) => write("warn", msg, f),
    error: (msg: string, f?: Fields) => write("error", msg, f),
    child: (fields: Fields) =>
      createLogger(min, { ...base, ...fields }),
  };
}
export type Logger = ReturnType<typeof createLogger>;
