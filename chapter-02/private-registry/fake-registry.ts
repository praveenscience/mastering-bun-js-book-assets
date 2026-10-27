// A tiny stand-in registry that prints what Bun sends it, to see the scope URL and token in action.
// 1. bun fake-registry.ts
// 2. In another project, set [install.scopes] "@acme" = { url = "http://localhost:4873/", token = "$NPM_TOKEN" }
// 3. NPM_TOKEN=demo-token bun add @acme/payments   (the install fails with 404, which is expected)
Bun.serve({
  port: 4873,
  fetch(req) {
    console.log("request:", new URL(req.url).pathname, "auth:", req.headers.get("authorization"));
    return new Response("{}", { status: 404 });
  },
});
console.log("fake registry on http://localhost:4873/");
