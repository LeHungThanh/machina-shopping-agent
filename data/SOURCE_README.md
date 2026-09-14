# Machina — 100 synthetic merchants (no images)

> All merchants, brands, products, reviews, prices, URLs and evidence in this dataset are fictional. Do not present any record as real merchant or customer data.

This standalone dataset follows the deep catalogue structure of the existing Machina nine-merchant showcase. It contains 100 distinct merchants, 50 products per merchant and no image files or image metadata.

## Dataset size

| Entity | Count |
|---|---:|
| Merchants | 100 |
| Retail verticals | 9 |
| Products | 5,000 |
| Product families | 500 |
| Variants | 15,000 |
| Current merchant offers | 15,000 |
| Price-history records | 30,000 |
| Reviews | 100,000 |
| Review-aspect records | 100,000 |
| Product facts | 40,000 |
| Evidence documents | 5,000 |
| Image files / media records | 0 |

The nine verticals are running shoes, travel backpacks, wireless headphones, coffee makers, facial skincare, desk lamps, water bottles, yoga mats and wristwatches. Merchants are distributed deterministically across these verticals.

## Contents

- `machina_100_merchants.sqlite` — ready-to-query SQLite database.
- `schema.sql` — relational schema and MCP-safe views.
- `data/` — portable JSON and JSONL exports.
- `contracts/` — JSON Schema contracts for purchase intent and ranked results.
- `generator/` — deterministic generator and validator.

`media_assets` remains in the relational schema for compatibility, but contains zero rows. `mcp_product_cards.primary_image_path` and `primary_image_alt` are always `NULL`.

## Core model

```text
merchants
  -> brands + categories + product_families
  -> products -> product_variants
  -> merchant_offers -> price_history + inventory_levels
  -> reviews + review_aspects
  -> product_facts -> fact_evidence -> evidence_documents
  -> product_search_documents + product_keywords + product_aliases
```

## Regenerate and validate

```bash
npm install
npm run generate
npm run validate
```

Generation is deterministic under seed `MACHINA_100_MERCHANTS_NO_IMAGES_V1_2026`.

## MCP guidance

Resolve or require `merchant_id` before product search. Search should return at most five products. Product details should return one product at a time, at most three review highlights, approved agent-visible facts and only relevant exact evidence spans. Image fields should be omitted from the response when their value is `NULL`.
