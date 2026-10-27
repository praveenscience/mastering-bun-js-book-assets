import { gitCommit, buildTime } from "./macros" with { type: "macro" };

console.log("commit", gitCommit(), "built", buildTime());
