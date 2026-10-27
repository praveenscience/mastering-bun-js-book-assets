import templatePath from "../templates/shipped.txt" with { type: "file" };

const template = await Bun.file(templatePath).text();
console.log(template.replace("{{name}}", "Asha").replace("{{id}}", "42").trim(), "| read from", templatePath);
