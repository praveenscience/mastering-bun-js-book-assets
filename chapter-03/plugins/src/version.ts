import info from "build:info";

console.log(
  `commit ${info.commit}, built ${info.builtAt} with Bun ${info.bun}`,
);
