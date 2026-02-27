# Byreal MCP Server

MCP server for [Byreal DEX](https://www.byreal.io) — Solana CLMM with CEX-grade liquidity.

Exposes Byreal operations as tools for AI agents via the [Model Context Protocol](https://modelcontextprotocol.io).

## Tools

| Tool | Status | Description |
|------|--------|-------------|
| `byreal_swap_quote` | ✅ Live | Get swap quote (no wallet needed) |
| `byreal_swap_transaction` | ✅ Live | Build unsigned swap tx |
| `byreal_pool_live_price` | ✅ Live | Get live price for any pair |
| `byreal_market_overview` | ✅ Live | SOL/bbSOL/USDT prices |
| `byreal_token_price` | ✅ Live | USD price for any supported token |
| `byreal_known_tokens` | ✅ Live | List token addresses |
| `byreal_list_pools` | ⚠️ API pending | Pool list with TVL/APR |
| `byreal_pool_info` | ⚠️ API pending | Detailed pool info |
| `byreal_list_positions` | ⚠️ API pending | Wallet LP positions |
| `byreal_calculate_apr` | ⚠️ Partial | APR estimation |

> ⚠️ Byreal's REST pool/position API (`/dex/v1/pools/*`) currently returns internal errors.
> Swap Router (`/router/v1/router-service/swap`) works fully.
> Pool/position tools will be upgraded once the API is available.

## Quick Start

```bash
# Install deps
npm install

# Run server (stdio)
npx tsx src/index.ts

# Register with mcporter
mcporter config add byreal --stdio "npx tsx /path/to/byreal-mcp/src/index.ts"

# Use
mcporter list byreal
mcporter call byreal.byreal_swap_quote --args '{"inputMint":"So11111111111111111111111111111111111111112","outputMint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","amount":"1000000000"}'
mcporter call byreal.byreal_market_overview
```

## Architecture

```
src/
├── index.ts          — MCP server entry + transport
├── config.ts         — Chain client, API endpoints, fetch helpers
└── tools/
    ├── pools.ts      — Pool query tools
    ├── swap.ts       — Swap quote + transaction tools
    ├── positions.ts  — Position management tools
    └── tokens.ts     — Token price + info tools
```

## Key Addresses

| Contract | Address |
|----------|---------|
| CLMM Program | `REALQqNEomY6cQGZJUGwywTBD2UmDT32rZcNnfxQ5N2` |
| Router | `REALp6iMBDTctQqpmhBo4PumwJGcybbnDpxtax3ara3` |
| Reset Launchpad | `REALdpFGDDsiD9tvxYsXBTDpgH1gGQEqJ8YSLdYQWGD` |
| RFQ | `REALFP9S4VmrAixmeYa68FrPKn4NVD2QFxxMfz9arhz` |

## SDK Reference

https://github.com/byreal-git/byreal-clmm-sdk

## Roadmap

### v0.1 ✅ Current
- Swap quotes and transactions via Router
- Live token pricing
- Pool and position fallback stubs

### v0.2
- Position management via SDK (on-chain, no REST dependency)
- Swap execution with signing support
- LP open/close/rebalance workflow

### v0.3
- LP strategy recommendations (optimal range, rebalancing triggers)
- Position monitoring + alert hooks
- Reset Launchpad integration
- Copy trade memo v2 (`referer_position=<position_address>`)
