import { createServer } from "node:http";

createServer((request, response) => {
  response.end("Hello");
}).listen(3000);
