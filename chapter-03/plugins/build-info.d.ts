declare module "build:info" {
  const info: { commit: string; builtAt: string; bun: string };
  export default info;
}
