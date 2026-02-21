import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "..");
const docsPath = path.join(repoRoot, "docs", "codecks-api", "api-reference.md");
const schemaPath = path.join(repoRoot, "src", "schemas", "codecks-api-schema.json");

if (!fs.existsSync(docsPath)) {
  throw new Error(`Missing API reference markdown at ${docsPath}`);
}

const markdown = fs.readFileSync(docsPath, "utf8");
const lines = markdown.split(/\r?\n/);

const models = {};
let currentModel = null;
let section = null; // "fields" | "relations" | null
let pendingName = null;
let parsingModels = false;

const stripLink = (text) => {
  const linkMatch = text.match(/^\[(.+?)\]\(#.+?\)$/);
  if (linkMatch) {
    return linkMatch[1].trim().replace(/\\+([_`])/g, "$1");
  }
  return text.trim().replace(/\\+([_`])/g, "$1");
};

const ensureModel = (name) => {
  if (!models[name]) {
    models[name] = {
      type: name === "_root" ? "root" : "model",
      fields: {},
      relations: {}
    };
  }
};

for (const rawLine of lines) {
  const line = rawLine.trim();

  if (line === "## The API Reference") {
    parsingModels = true;
    currentModel = null;
    section = null;
    pendingName = null;
    continue;
  }

  if (!parsingModels) {
    continue;
  }

  const modelMatch = line.match(/^##\s+(?:\[(.+?)\]\(#.+?\)|(.+))$/);
  if (modelMatch) {
    const modelName = stripLink((modelMatch[1] || modelMatch[2]).trim());
    currentModel = modelName;
    section = null;
    pendingName = null;
    ensureModel(modelName);
    continue;
  }

  if (line.startsWith("### Fields")) {
    section = "fields";
    pendingName = null;
    continue;
  }

  if (line.startsWith("### Relations")) {
    section = "relations";
    pendingName = null;
    continue;
  }

  if (line.startsWith("## ") || line.startsWith("### ")) {
    section = null;
    pendingName = null;
    continue;
  }

  if (!section || !currentModel || line.length === 0) {
    continue;
  }

  if (!pendingName) {
    pendingName = stripLink(line);
    continue;
  }

  const typeRaw = stripLink(line);

  if (section === "fields") {
    if (!models[currentModel].fields[pendingName]) {
      models[currentModel].fields[pendingName] = typeRaw;
    }
  } else if (section === "relations") {
    const isMany = typeRaw.endsWith("[]");
    const typeName = isMany ? typeRaw.slice(0, -2) : typeRaw;
    if (!models[currentModel].relations[pendingName]) {
      models[currentModel].relations[pendingName] = {
        type: typeName,
        cardinality: isMany ? "many" : "one"
      };
    }
  }

  pendingName = null;
}

if (models.user) {
  models.user.quirks = {
    email: {
      invalid: true,
      workaround: "Use primaryEmail relation to access userEmail.email"
    }
  };
}

const existing = fs.existsSync(schemaPath)
  ? JSON.parse(fs.readFileSync(schemaPath, "utf8"))
  : {};

const nextSchema = {
  $schema: existing.$schema || "http://json-schema.org/draft-07/schema#",
  title: existing.title || "Codecks API Schema",
  description: existing.description || "Structured schema for Codecks API models, fields, and relations",
  version: existing.version || "1.0.0",
  generatedAt: new Date().toISOString(),
  source: "docs/codecks-api/api-reference.md",
  models,
  queryOperators: existing.queryOperators || {},
  specialQueryFields: existing.specialQueryFields || {},
  responseFormat: existing.responseFormat || {}
};

fs.writeFileSync(schemaPath, JSON.stringify(nextSchema, null, 2) + "\n");
console.log(`Generated schema for ${Object.keys(models).length} models -> ${schemaPath}`);
