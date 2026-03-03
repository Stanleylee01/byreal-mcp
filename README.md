# Byreal MCP Server v0.6.2

MCP server for [Byreal DEX](https://www.byreal.io) — Solana CLMM with CEX-grade liquidity.

Exposes all Byreal operations as MCP tools for AI agents via the [Model Context Protocol](https://modelcontextprotocol.io).

**41 tools** covering: pools, swap, positions, liquidity management, copy farming, market data, orders, tokens, wallet management with auto-sign, and **intelligent analysis tools**.

## What's New in v0.6

- **`byreal_pool_analyze`** — Multi-range APR analysis with risk factors and investment projections
- **`byreal_position_analyze`** — Position health check with pool context enrichment
- **`byreal_easy_swap`** — Human-friendly swap: `fromToken="SOL" toToken="USDC" amount="1.5"` — one call does quote + sign + send
- **`amountUsd` mode** — Open or copy positions with `amountUsd=100` — auto-calculates token A/B split based on current price and range
- **`dryRun` mode** — Preview any swap without executing: `dryRun=true`
- **Error recovery suggestions** — Context-aware `💡 Suggestions` on every error (insufficient balance → check wallet, slippage → increase bps, etc.)
- **`byreal_catalog`** — Agent self-discovery: search tools by keyword
- **Expanded CopyFarmer** — `top_positions` with sortField/status filter, `farmer_positions`, `top_farmers`
- **`keypairPath` wallet** — Use an existing Solana keypair file instead of generating a new one

## Quick Start

### Use with Claude Code

```bash
# 1. Clone & install
git clone https://github.com/Stanleylee01/byreal-mcp.git
cd byreal-mcp && npm install && npm run build

# 2. Configure RPC (get free Helius API key: https://helius.dev)
bash scripts/setup.sh

# 3. Register as MCP server in Claude Code
claude mcp add byreal -- node $(pwd)/dist/index.js

# 4. Restart Claude Code → 41 tools available
# Say "帮我创建钱包" to get started
```

### Use with Cursor

Add to `.cursor/mcp.json`:
```json
{
  "byreal": {
    "command": "node",
    "args": ["/path/to/byreal-mcp/dist/index.js"]
  }
}
```

### Use with mcporter (OpenClaw)

```bash
mcporter config add byreal --stdio "node ~/clawd/byreal-mcp/dist/index.js"
mcporter list byreal    # should list 41 tools
mcporter call byreal.byreal_global_overview
```

### Wallet Setup (optional — enables auto-sign for write operations)

```bash
# Option A: Generate new keypair
# In Claude Code just say "帮我创建钱包" or call byreal_wallet_setup

# Option B: Use existing keypair file
# Edit ~/.byreal-mcp/wallet.json:
# { "keypairPath": "/path/to/your/id.json" }

# ⚠️ Back up your wallet — losing it = funds are unrecoverable
```

> **Read-only tools work without wallet config.** Wallet is only needed for swap/LP/copy operations.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BYREAL_API_BASE` | `https://api2.byreal.io/byreal/api` | Byreal REST API base URL |
| `SOL_RPC` | `https://api.mainnet-beta.solana.com` | Solana RPC endpoint |
| `SOL_ENDPOINT` | _(same as SOL_RPC)_ | Alias accepted by SDK scripts |
| `HTTPS_PROXY` | _(unset)_ | HTTP proxy for SDK subprocess calls (needed in China) |

## Tools (41 total)

### Pools (5)
| Tool | Description |
|------|-------------|
| `byreal_list_pools` | List pools sorted by TVL, volume, fees, or APR |
| `byreal_pool_info` | Get info for one or more pools by address |
| `byreal_pool_details` | Comprehensive single-pool details with price changes |
| `byreal_pool_live_price` | Live price for any token pair via Router |
| `byreal_pool_analyze` | **NEW** Multi-range APR analysis, risk factors, investment projection |

### Swap (3)
| Tool | Description |
|------|-------------|
| `byreal_swap_quote` | Get quote without wallet (raw lamport amounts) |
| `byreal_swap_transaction` | Build unsigned swap tx (raw lamports, manual sign) |
| `byreal_easy_swap` | **NEW** Human-friendly swap with `dryRun` mode + error suggestions |

### Positions — Read (8)
| Tool | Description |
|------|-------------|
| `byreal_list_positions` | List all LP positions for a wallet with PnL summary |
| `byreal_position_analyze` | **NEW** Position health check with pool context enrichment |
| `byreal_calculate_apr` | Estimate APR for a hypothetical deposit |
| `byreal_position_detail` | Full detail for a specific position address |
| `byreal_position_overview` | Aggregate position stats for a wallet |
| `byreal_position_pnl` | Detailed PnL breakdown (deposit, fees, rewards, bonus) |
| `byreal_unclaimed_fees` | Check what's claimable without collecting |
| `byreal_create_position_info` | Preview token amounts before opening |

### Liquidity — Write (8)
| Tool | Description |
|------|-------------|
| `byreal_open_position` | Open new CLMM position. Supports `amountUsd` auto-split |
| `byreal_close_position` | Close position, remove all liquidity |
| `byreal_add_liquidity` | Add more tokens to existing position |
| `byreal_remove_liquidity` | Remove N% of liquidity |
| `byreal_submit_liquidity_tx` | Broadcast signed liquidity tx |
| `byreal_collect_fees_tx` | Build tx to collect trading fees |
| `byreal_claim_rewards_tx` | Build tx to claim incentive rewards |
| `byreal_submit_claim` | Submit signed reward claim tx |

### CopyFarmer (5)
| Tool | Description |
|------|-------------|
| `byreal_top_farmers` | Leaderboard of top LP farmers |
| `byreal_top_positions` | Top positions with sortField (liquidity/apr/earned/pnl/copies) + status filter |
| `byreal_farmer_positions` | All positions for a specific farmer |
| `byreal_copyfarmer_overview` | Global CopyFarmer program stats |
| `byreal_copy_position` | Copy a farmer's position. Supports `amountUsd` auto-split |

### Market Data (6)
| Tool | Description |
|------|-------------|
| `byreal_global_overview` | DEX-wide TVL, volume, fees (24h + all-time) |
| `byreal_mint_prices` | Batch USD price lookup (up to 20 tokens) |
| `byreal_mint_list` | Search/list all tokens on Byreal |
| `byreal_hot_tokens` | Trending tokens |
| `byreal_kline` | K-line (OHLCV) candlestick data |
| `byreal_dynamic_fee` | Current dynamic fee rates |

### Orders (2)
| Tool | Description |
|------|-------------|
| `byreal_order_history` | Swap/trade order history for a wallet |
| `byreal_list_orders` | List active limit orders |

### Tokens (3)
| Tool | Description |
|------|-------------|
| `byreal_token_price` | Live USD price by symbol or mint |
| `byreal_market_overview` | Quick price snapshot: SOL, bbSOL, USDT |
| `byreal_known_tokens` | List known mint addresses and decimals |

### Wallet (3)
| Tool | Description |
|------|-------------|
| `byreal_wallet_setup` | Generate local Solana keypair |
| `byreal_wallet_status` | Check address, SOL/USDC balance |
| `byreal_sign_and_send` | Sign unsigned tx + broadcast to Solana |

### Discovery (1)
| Tool | Description |
|------|-------------|
| `byreal_catalog` | List all tools with descriptions. Search by keyword. |

## Key Features

### amountUsd Mode (v0.6)
Instead of manually calculating token amounts:
```
byreal_open_position({
  poolAddress: "...",
  priceLower: "80", priceUpper: "90",
  amountUsd: 100,      // ← invest $100, auto-split A/B
  userAddress: "..."
})
```
Works for `open_position` and `copy_position`. Auto-fetches current prices from pool details.

### dryRun Mode (v0.6)
Preview any swap without executing:
```
byreal_easy_swap({
  fromToken: "SOL", toToken: "USDC", amount: "1.5",
  dryRun: true          // ← quote only, no tx
})
```

### Error Recovery Suggestions (v0.6)
Every error includes actionable next steps:
```
❌ Execution failed: insufficient funds
💡 Suggestions:
  • Check balance: byreal_wallet_status
  • You may need more SOL for gas
  • Try a smaller amount
```

### Auto-Sign Mode
When wallet is configured, write tools automatically sign and broadcast:
```
byreal_easy_swap → quote → sign with local keypair → broadcast → {signature, explorerUrl}
```

### Copy Farm
```
1. byreal_top_positions → find top farmer by earned/pnl
2. byreal_copy_position → replicate their tick range with amountUsd
```
Inserts `REFERER_POSITION` memo for on-chain copy bonus tracking.

## Architecture

```
byreal-mcp/
├── src/
│   ├── index.ts              — MCP server entry, transport, tool registration
│   ├── config.ts             — Chain client, API endpoints, fetch helpers
│   ├── wallet.ts             — Keypair management, signing, balance queries
│   └── tools/
│       ├── pools.ts          — Pool queries + pool_analyze
│       ├── swap.ts           — Swap quote + easy_swap with dryRun
│       ├── positions.ts      — Position list + position_analyze
│       ├── liquidity.ts      — Open/close/add/remove + copy with amountUsd
│       ├── copyfarmer.ts     — Top farmers, top positions, farmer overview
│       ├── market.ts         — Global overview, prices, klines, dynamic fees
│       ├── orders.ts         — Order history
│       ├── tokens.ts         — Token prices, known tokens
│       ├── wallet.ts         — Wallet tool definitions
│       └── catalog.ts        — Tool discovery catalog
├── sdk-ref/                  — @byreal/clmm-sdk (DO NOT MODIFY)
│   └── src/scripts/          — SDK scripts for building transactions
├── scripts/
│   └── setup.sh              — One-line config setup
├── dist/                     — Compiled JS (npm run build)
└── package.json
```

## Key Addresses

| Contract | Address |
|----------|---------|
| CLMM Program | `REALQqNEomY6cQGZJUGwywTBD2UmDT32rZcNnfxQ5N2` |
| Router | `REALp6iMBDTctQqpmhBo4PumwJGcybbnDpxtax3ara3` |
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| SOL | `So11111111111111111111111111111111111111112` |
| bbSOL | `Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B` |

## Known Limitations

- **Proxy required in China**: SDK subprocesses use `HTTPS_PROXY` for on-chain RPC calls.
- **Tick alignment**: CLMM positions snap to pool's `tickSpacing`. SDK handles this — don't pre-align.
- **amountUsd is approximate**: Uses linear price interpolation, not full CLMM tick math. Accurate to ~1-2%.
- **SDK requires Node.js**: Scripts use `npx tsx`. Node must be in `PATH`.

## Changelog

### v0.6.2 (2026-03-03)
- `byreal_pool_analyze` — multi-range APR + risk assessment
- `byreal_position_analyze` — position health + pool context
- `byreal_easy_swap` — human-friendly with `dryRun` mode
- `amountUsd` mode for `open_position` + `copy_position`
- Error recovery `💡 Suggestions` on all write ops
- `byreal_catalog` — agent self-discovery
- `keypairPath` wallet support
- Fixed: pool_info 404, pool_analyze field mapping, signAndSend blockhash refresh
- Expanded CopyFarmer: sortField, status filter, farmer_positions

### v0.5.0
- 36 tools, local keypair wallet, auto-sign
- CLMM open/close/add/remove via SDK subprocesses
- Copy Farm with REFERER_POSITION memo
- CopyFarmer leaderboards

### Roadmap
- Reset Launchpad integration
- Position auto-rebalance (tick drift detection)
- Portfolio summary
- Strategy recommendations
- Transaction spending limits
