// scripts/generate-models.mjs
import fs from "node:fs";
import path from "node:path";

const specPath = path.resolve("openapi-spec.json");
const outPath  = path.resolve("src/generated/map.ts");

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const schemaNames = Object.keys(spec.components?.schemas ?? {});

let contents = `// AUTO-GENERATED FILE. DO NOT EDIT.
import type { components } from "./openapi-spec";
type Schemas = components["schemas"];

`;

for (const name of schemaNames) {
  // Basic TS identifier safety (naive but usually fine for normal schema names)
  contents += `export type ${name} = Schemas["${name}"];\n`;
}

fs.writeFileSync(outPath, contents);
console.log("Wrote", outPath);
