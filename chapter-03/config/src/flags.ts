declare const BUILD_VERSION: string;

if (process.env.NODE_ENV !== "production") {
  console.log("debug logging on");
}

console.log("version", BUILD_VERSION, "api", process.env.PUBLIC_API_URL, "secret", process.env.SECRET_KEY);
