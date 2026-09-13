# Machina

**Machina is a cross-merchant Product Intelligence Gateway.** An AI shopping agent (Claude,
via MCP) sends it a plain-language request; Machina figures out which product category it's
about, ranks real competing merchants' offers for it, and gives back grounded reasons for
each pick — while a merchant-controlled disclosure layer decides exactly what the agent is
allowed to see.

> **All data in this repository is synthetic.** Every merchant, product, review, price, and
> image is fictional, generated for demonstration and testing. Nothing here is real
> commercial data, and none of it should ever be presented as such.

## What it actually does

Ask it something in plain language — no need to name a product or a store:

```
"a neutral support running shoe for track running, wide fit, under 160 AUD"
```

Machina will:
1. Figure out which of its 9 product categories this is about (or ask, if it's genuinely
   unclear — e.g. "something nice for my mom" gets a real clarifying question, not a guess).
2. Rank every competing merchant's matching offer — deterministically, never by an LLM guess.
3. Return results like:

   | Product | Merchant | Price | Badge | Why |
   |---|---|---|---|---|
   | Velora Ridge Crest 13 | Velora Runworks | $149.40 | best overall | Neutral support, track surface, wide fit all confirmed |
   | Ridgemark Ridge Crest 13 | Ridgemark Trailhead | $161.84 | fastest delivery | Ships in 1 day |

4. Every product carries a real image, and asking for details returns the actual photo
   inline, not just a link.

## Why "CONTROL" matters

A merchant can mark any fact about a product as:
- **Agent-visible** — the AI can see and repeat it.
- **Matching-only** — Machina still uses it to rank products, but never tells the AI it
  exists, even indirectly.
- **Internal-only** — never touches ranking or disclosure at all; merchant records only.

This means a product can rank highly for a reason the AI is never allowed to name — verified
live in this repo (see `AGENTS.md`'s CONTROL section for the exact example).

## Quick start

```bash
git clone <this-repo>
cd machina
npm install
cp .env.example .env        # then add your own OPENAI_API_KEY — never commit this file
npm run db:init              # create the SQLite schema
npm run db:seed              # bulk-load the synthetic 9-merchant dataset
```

Register the MCP server with an MCP-capable agent (Claude Code, Codex, etc.) — this repo's
`.mcp.json` already does this for Claude Code; open the repo in a **fresh** session and
approve the `machina` MCP server when prompted, then ask it a shopping question.

To browse the merchant-side dashboard instead:
```bash
npm run dev:dashboard         # http://localhost:3000
```

Verify everything end-to-end without needing an agent session:
```bash
npm run typecheck
npm test                      # 27 tests, all LLM calls mocked — no API key needed
npx tsx tests/mcp-smoke.ts    # drives the real MCP server live — needs OPENAI_API_KEY
```

## Architecture, in one paragraph

One connection can search the **whole database** (default — Machina classifies which
category a request belongs to, per call), or be narrowed to one vertical or one merchant via
env vars. Ranking is a deterministic pipeline (hard filters → hybrid retrieval →
multi-objective utility → merchant diversity → structured decision factors) with exactly one
LLM step at the end that turns those factors into a sentence — it never influences the
ranking itself. Full technical details, invariants, and known limitations live in
[`AGENTS.md`](AGENTS.md).

## Repository size note

`data/assets/` bundles ~71MB of real (synthetic) product photos so `get_product_details` can
return actual images. If you're cloning just to read the code, this is the bulk of the
download.

## License

No license has been chosen yet for this project — all rights reserved by default until one
is added.
