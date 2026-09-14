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
   | Aldercraft Ridge Crest 13 | Aldercraft Runworks | $149.40 | best overall | Neutral support, track surface, wide fit confirmed — also the lowest price and shipping fee |
   | Lumaridge Ridge Crest 13 | Lumaridge Runworks | $152.40 | fastest delivery | Ships in 2–5 days |

   Results routinely span 10+ genuinely distinct, competing merchants per category — this
   isn't a demo of 2–3 hand-picked sellers.

## Why "CONTROL" matters

A merchant can mark any fact about a product as:
- **Agent-visible** — the AI can see and repeat it.
- **Matching-only** — Machina still uses it to rank products, but never tells the AI it
  exists, even indirectly.
- **Internal-only** — never touches ranking or disclosure at all; merchant records only.

This means a product can rank highly for a reason the AI is never allowed to name — verified
live in this repo (see `AGENTS.md`'s CONTROL section for the exact example).

## Prerequisites

- **Node.js 20+** and npm.
- **An OpenAI API key** ([platform.openai.com](https://platform.openai.com/api-keys)) — used
  for buyer-language understanding, ranking's semantic-similarity step, and generating each
  product's `reason`. Cost per query is small (short `gpt-4o-mini` calls + one embedding
  batch), but you do need a key with some usage available — there is no offline/no-key mode
  for live search.
- **macOS only**: Xcode Command Line Tools (`xcode-select --install`), for `better-sqlite3`'s
  native module.

## Setup (5 steps)

```bash
git clone https://github.com/LeHungThanh/machina-shopping-agent.git
cd machina-shopping-agent
npm install
```

If `npm install` fails while building `better-sqlite3` (macOS only — a `climits`/SDK error):
```bash
export SDKROOT=$(xcrun --show-sdk-path) && npm rebuild better-sqlite3
```

**2. Add your API key**
```bash
cp .env.example .env
```
Open `.env` and set `OPENAI_API_KEY=sk-...`. This file is gitignored — it will never be
committed.

**3. Create and load the database**
```bash
npm run db:init    # creates machina.db from data/schema.sql
npm run db:seed    # bulk-loads the synthetic 100-merchant dataset into it
```
Expected output ends with a line per table, e.g. `seeded products: 5000 rows`. This step
loads a genuinely large dataset (100 merchants, 5,000 products, 100,000 reviews) — it takes
a little while and has no progress bar.

**4. Confirm everything is wired correctly**
```bash
npm run typecheck   # should print nothing but the command itself — no errors
npm test            # 34 tests, all green, no API key needed for this step
```

**5. Try a real, live search** (this step needs your API key from step 2):
```bash
npx tsx tests/mcp-smoke.ts
```
This starts the real MCP server and drives it exactly like an AI agent would — search,
product details, suitability check, and a mock offer. If this prints real JSON results with
no errors, the whole system is working end to end.

## Using it as an AI agent (the main way this is meant to be used)

This repo's `.mcp.json` already registers Machina as an MCP server. With **Claude Code**:

1. Open this repo's folder in Claude Code.
2. Start a **new** session (an already-running session won't pick up `.mcp.json`).
3. Approve the `machina` MCP server when prompted.
4. Just ask a shopping question — no special syntax needed:
   - `"a neutral support running shoe for track running, wide fit, under 160 AUD"` — should
     return results from more than one merchant.
   - `"a carry-on backpack around 20 litres"` — a completely different category; Machina
     figures that out on its own.
   - `"something nice for my mom"` — deliberately vague; expect a real clarifying question
     naming the actual product categories available, not a generic gift-idea list.

Other MCP-capable agents (Codex, etc.) can register the same server — see `.mcp.json` and
`AGENTS.md` for the exact command.

## Using the merchant dashboard instead

```bash
npm run dev:dashboard   # http://localhost:3000
```
This is the merchant-side view — catalogue health, the approval queue for pending product
facts (with the CONTROL visibility picker), and demand/gap analytics. It's a separate app
from the AI-agent path above; changes you approve here are what a calling agent can
eventually see.

## Troubleshooting

| Problem | Fix |
|---|---|
| `better-sqlite3` fails to build on macOS | `export SDKROOT=$(xcrun --show-sdk-path) && npm rebuild better-sqlite3` |
| `OPENAI_API_KEY is not set` | You skipped step 2, or `.env` isn't at the repo root |
| MCP server doesn't show up in Claude Code | Restart the session — `.mcp.json` is only read at session start |
| Dashboard errors on `localhost:3000` | Make sure `npm run db:init` + `npm run db:seed` ran first |
| Port 3000 already in use | Something else is already running there — stop it or change the port in `apps/dashboard`'s dev command |

## Architecture, in one paragraph

One connection can search the **whole database** (default — Machina classifies which
category a request belongs to, per call), or be narrowed to one vertical or one merchant via
env vars. Ranking is a deterministic pipeline (hard filters → hybrid retrieval →
multi-objective utility → merchant diversity → structured decision factors) with exactly one
LLM step at the end that turns those factors into a sentence — it never influences the
ranking itself. Full technical details, invariants, and known limitations live in
[`AGENTS.md`](AGENTS.md).

## No product images in this dataset

The current 100-merchant dataset ships with zero images (`media_assets` is intentionally
empty — see its own README under `data/SOURCE_README.md`). `get_product_details`'s `images`
field is always `[]`; the code that embeds a real product photo into the MCP response is
still there and works (it was built and verified against an earlier 9-merchant dataset that
did include images) — it simply has nothing to embed with this particular dataset.

## License

No license has been chosen yet for this project — all rights reserved by default until one
is added.
