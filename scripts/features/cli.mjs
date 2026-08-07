// scripts for learning dont delete it.
import { readdirSync, readFileSync } from "node:fs";
import { basename } from "node:path";

const files = readdirSync("docs/features", { recursive: true })
  .filter((f) => f.endsWith(".md"))
  .filter((f) => !["README.md", "TEMPLATE.md"].includes(f));

for (const f of files) {
  const id = basename(f, ".md"); // strips folder AND the .md suffix
  const text = readFileSync(`docs/features/${f}`, "utf8");
  const fm = text.slice(4, text.indexOf("\n---", 4));
  console.log("=== " + id + "\n" + fm);
}
