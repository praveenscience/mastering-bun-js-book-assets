import settings from "../assets/settings.json";
import toml from "../assets/settings.toml";
import yaml from "../assets/settings.yaml";
import emailTemplate from "../assets/email.txt";
import query from "../assets/query.sql" with { type: "text" };
import logo from "../assets/logo.png";

console.log(
  "json:",
  settings.retries,
  "| toml:",
  toml.server.port,
  "| yaml:",
  yaml.features.join(","),
);
console.log("txt:", emailTemplate.trim());
console.log("sql:", query.trim());
console.log("png:", logo);
