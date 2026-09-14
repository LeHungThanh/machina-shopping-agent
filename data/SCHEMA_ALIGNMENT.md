# Schema alignment

This dataset preserves the normalized Machina product-and-merchant model used by the nine-merchant fixture.

## Included

- Merchant identity and lifecycle status
- Merchant-specific brands, categories and product families
- Canonical product identity and merchant listings
- Three variants per product
- Current offer, price history, inventory, shipping and return information
- Twenty synthetic reviews and one aspect extraction per review
- Eight controlled attributes per product
- Evidence documents, exact spans, approval decisions and visibility controls
- Search documents, normalized keywords, aliases, sample intents and ranked results
- JSON Schema contracts and SQLite MCP-safe views

## Deliberately excluded

- Product image files
- Thumbnails and source contact sheets
- Populated `media_assets` records

The empty `media_assets` table and nullable image columns in `mcp_product_cards` preserve interface compatibility for consumers that also use image-enabled Machina datasets.
