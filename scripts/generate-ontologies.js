// Generates data/ontologies/<vertical>.json for every vertical present in the dataset, from
// its own categories.json + ontology_attributes.jsonl — so packages/schemas' loadOntology()
// (file-based, cached per vertical) never needs code changes when the underlying dataset is
// swapped for a different one using the same schema (e.g. the 9-merchant showcase vs. the
// 100-merchant no-images dataset).
//
// Run once after replacing data/jsonl/: node scripts/generate-ontologies.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const JSONL_DIR = path.join(DATA_DIR, 'jsonl');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(JSONL_DIR, file), 'utf-8'));
}
function readJsonl(file) {
  return fs
    .readFileSync(path.join(JSONL_DIR, file), 'utf-8')
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l));
}

function verticalSlug(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

function generateOntologies() {
  const categories = readJson('categories.json');
  const attrs = readJsonl('ontology_attributes.jsonl');
  const leafCategories = categories.filter((c) => c.parent_id !== null);

  // Multiple merchants share a vertical, each with its own category row and its own
  // ontology_attributes rows — dedupe by vertical slug, since loadOntology() is one file
  // per vertical, not one per merchant's copy of that vertical's category.
  const seen = new Set();
  const ontologiesDir = path.join(DATA_DIR, 'ontologies');
  fs.mkdirSync(ontologiesDir, { recursive: true });

  for (const cat of leafCategories) {
    const vertical = verticalSlug(cat.name);
    if (seen.has(vertical)) continue;
    seen.add(vertical);

    const catAttrs = attrs.filter((a) => a.category_id === cat.id);
    const attributes = {};
    for (const a of catAttrs) {
      attributes[a.attribute_key] = {
        type: a.data_type,
        values: JSON.parse(a.allowed_values_json),
      };
    }
    fs.writeFileSync(
      path.join(ontologiesDir, `${vertical}.json`),
      JSON.stringify({ vertical, attributes }, null, 2)
    );
    console.log(`ontology: ${vertical}.json (${catAttrs.length} attributes, from ${cat.id})`);
  }
}

generateOntologies();
console.log('done');
