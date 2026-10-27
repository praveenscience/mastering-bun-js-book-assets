const file = Bun.embeddedFiles.find(
  (f) => f.name === "templates/shipped.txt",
);
console.log(file ? (await file.text()).trim() : "not embedded");
