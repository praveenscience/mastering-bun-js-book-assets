console.log({
  NODE_ENV: Bun.env.NODE_ENV,
  SHARED: Bun.env.SHARED,
  SECRET: Bun.env.SECRET,
  sameObject: Bun.env === process.env,
});
