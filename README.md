# Byreal MCP Server v0.4.0

MCP server for [Byreal DEX](https://www.byreal.io) — Solana CLMM with CEX-grade liquidity.

Exposes all Byreal operations as MCP tools for AI agents via the [Model Context Protocol](https://modelcontextprotocol.io).

**38 tools** covering: pools, swap, positions, liquidity management, copy farming, market data, orders, tokens, and **wallet management with auto-sign**.

## Quick Start

### Use with Claude Code

```bash
# 1. Clone & install
git clone https://github.com/Stanleylee01/byreal-mcp.git
cd byreal-mcp && npm install && npm run build

# 2. Register as MCP server in Claude Code
claude mcp add byreal -- node /FULL/PATH/TO/byreal-mcp/dist/index.js

# 3. Done — restart Claude Code and all 38 tools are available
```

### Use with other MCP clients (Cursor, mcporter, etc.)

```bash
# mcporter
mcporter config add byreal --stdio "node /path/to/byreal-mcp/dist/index.js"
mcporter list byreal
mcporter call byreal.byreal_global_overview

# Cursor — add to .cursor/mcp.json:
# { "byreal": { "command": "node", "args": ["/path/to/byreal-mcp/dist/index.js"] } }
```

### Wallet Setup (optional — enables auto-sign for write operations)

```bash
mkdir -p ~/.byreal-mcp
cat > ~/.byreal-mcp/config.json << 'EOF'
{
  "privyAppId": "ask Stanley for credentials",
  "privyAppSecret": "...",
  "resendApiKey": "...",
  "rpcUrl": "https://your-helius-or-other-rpc.com"
}
EOF

# Then in Claude Code:
#   byreal_wallet_setup → enter email → get OTP
#   byreal_wallet_verify → enter code → wallet created
#   ⚠️ Back up ~/.byreal-mcp/auth_key.pem — lose it = lose wallet forever
```

> **Read-only tools work without wallet config.** Wallet is only needed for swap/LP/copy operations.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BYREAL_API_BASE` | `https://api2.byreal.io/byreal/api` | Byreal REST API base URL |
| `SOL_RPC` | `https://api.mainnet-beta.solana.com` | Solana RPC endpoint |
| `SOL_ENDPOINT` | _(same as SOL_RPC)_ | Alias accepted by SDK scripts |
| `HTTPS_PROXY` | _(unset)_ | HTTP proxy for SDK subprocess calls (needed in China) |

## Tools (38 total)

### Pools
| Tool | Description |
|------|-------------|
| `byreal_list_pools` | List pools sorted by TVL, volume, fees, or APR |
| `byreal_pool_info` | Get detailed info for one or more pools by address |
| `byreal_pool_details` | Get comprehensive single-pool details with price changes |
| `byreal_pool_live_price` | Get live price for any token pair via Router |

### Swap
| Tool | Description |
|------|-------------|
| `byreal_swap_quote` | Get swap quote without a wallet (price, impact, min received) |
| `byreal_swap_transaction` | Build unsigned swap transaction ready to sign |

### Positions (read)
| Tool | Description |
|------|-------------|
| `byreal_list_positions` | List all LP positions for a wallet with PnL summary |
| `byreal_calculate_apr` | Estimate APR for a hypothetical deposit on a pool |
| `byreal_position_detail` | Full detail for a specific position address |
| `byreal_position_overview` | Aggregate position stats for a wallet |
| `byreal_position_pnl` | Detailed PnL breakdown (deposit, fees, rewards, bonus) |
| `byreal_unclaimed_fees` | Check unclaimed fees and rewards for a wallet |
| `byreal_create_position_info` | Preview a position's token amounts before opening |

### Liquidity (write — returns unsigned tx)
| Tool | Description |
|------|-------------|
| `byreal_open_position` | Build unsigned tx to open a new CLMM position |
| `byreal_close_position` | Build unsigned tx to close a position and remove all liquidity |
| `byreal_add_liquidity` | Build unsigned tx to add more liquidity to an existing position |
| `byreal_remove_liquidity` | Build unsigned tx to remove a % of liquidity from a position |
| `byreal_submit_liquidity_tx` | Submit signed tx(s) for open/close/add/remove operations |
| `byreal_collect_fees_tx` | Build unsigned tx(s) to collect trading fees |
| `byreal_claim_rewards_tx` | Build unsigned tx(s) to claim incentive rewards or bonuses |
| `byreal_submit_claim` | Submit signed reward/bonus claim transactions |

### CopyFarmer
| Tool | Description |
|------|-------------|
| `byreal_top_farmers` | Leaderboard of top LP farmers sorted by PnL |
| `byreal_top_positions` | Leaderboard of top individual positions |
| `byreal_copyfarmer_overview` | Global CopyFarmer program stats |
| `byreal_copy_position` | Build unsigned tx to replicate a top farmer's position (with memo) |

### Market Data
| Tool | Description |
|------|-------------|
| `byreal_global_overview` | DEX-wide TVL, volume, fees (24h + all-time) |
| `byreal_mint_prices` | Batch USD price lookup for up to 20 tokens |
| `byreal_mint_list` | Search and list all tokens on Byreal |
| `byreal_hot_tokens` | Trending tokens on Byreal |
| `byreal_kline` | K-line (candlestick) data for any token |

### Orders
| Tool | Description |
|------|-------------|
| `byreal_order_history` | Swap/trade order history for a wallet |

### Tokens
| Tool | Description |
|------|-------------|
| `byreal_token_price` | Live USD price for any token (by symbol or mint) |
| `byreal_market_overview` | Quick price snapshot: SOL, bbSOL, USDT |
| `byreal_known_tokens` | List all known tokens with mint addresses and decimals |

### Wallet (auto-sign)
| Tool | Description |
|------|-------------|
| `byreal_wallet_setup` | Send 6-digit email OTP for wallet onboarding |
| `byreal_wallet_verify` | Verify OTP → create Privy MPC wallet |
| `byreal_wallet_status` | Check wallet address, email, SOL/USDC balance |
| `byreal_sign_and_send` | Sign unsigned tx via Privy + broadcast to Solana |

## Write Operations

All write operations build **unsigned base64 transactions**. Two modes:

### Auto-Sign Mode (recommended)
When wallet is configured (`~/.byreal-mcp/wallet.json`), write tools automatically sign and broadcast:
```
byreal_open_position → builds tx → Privy signs → Solana broadcast → {signature, explorerUrl}
```

### Manual Mode
Without wallet config, tools return unsigned base64 tx for external signing:
```
1. Call tool → get base64 unsigned tx
2. Sign with your wallet (Phantom, hardware wallet, etc.)
3. Submit signed tx via byreal_submit_liquidity_tx
```

### Wallet Setup
```bash
# Config (Privy + Resend credentials)
mkdir -p ~/.byreal-mcp
cat > ~/.byreal-mcp/config.json << EOF
{
  "privyAppId": "...",
  "privyAppSecret": "...",
  "resendApiKey": "...",
  "rpcUrl": "https://your-rpc.com"
}
EOF

# Then use MCP tools:
# byreal_wallet_setup → byreal_wallet_verify → wallet.json created automatically
```

Tools that build transactions via SDK subprocess (open/close/add/remove/copy) require `SOL_RPC` to be set for on-chain data fetching.

## Copy Farm

Copy Farm lets you replicate a top farmer's position tick range with your own capital.

```
1. byreal_top_farmers        → find a top farmer
2. byreal_top_positions      → see their open positions
3. byreal_position_detail    → get position details
4. byreal_copy_position      → build tx with same tick range
                                 (inserts REFERER_POSITION memo)
5. Sign tx
6. byreal_submit_liquidity_tx → broadcast
```

The `REFERER_POSITION` memo links your position to the original farmer — this is verified on-chain by the Byreal CopyFarmer program (CLMM program: `REALQqNEomY6cQGZJUGwywTBD2UmDT32rZcNnfxQ5N2`).

**Note**: Use `baseAmount` in UI units (e.g. `"50"` = $50 of Token A), not raw lamports.

## Architecture

```
byreal-mcp/
├── src/
│   ├── index.ts              — MCP server entry, transport, tool registration
│   ├── config.ts             — Chain client, API endpoints, fetch helpers
│   └── tools/
│       ├── pools.ts          — Pool queries (list, info, details, live price)
│       ├── swap.ts           — Swap quote + unsigned transaction
│       ├── positions.ts      — Position list, APR, overview, detail
│       ├── liquidity.ts      — All write ops: open/close/add/remove + fee/reward collection
│       ├── copyfarmer.ts     — Top farmers, top positions, overview leaderboards
│       ├── market.ts         — Global overview, prices, klines, hot tokens
│       ├── orders.ts         — Order history, position detail, overview
│       └── tokens.ts         — Token prices, market overview, known tokens
├── sdk-ref/                  — @byreal/clmm-sdk (DO NOT MODIFY)
│   └── src/scripts/          — SDK scripts for building transactions
│       ├── create-position.ts
│       ├── close-position.ts
│       ├── add-liquidity.ts
│       ├── decrease-liquidity.ts
│       └── proxy-setup.ts
├── dist/                     — Compiled JS (npm run build)
└── package.json
```

## Key Addresses

| Contract | Address |
|----------|---------|
| CLMM Program | `REALQqNEomY6cQGZJUGwywTBD2UmDT32rZcNnfxQ5N2` |
| Router | `REALp6iMBDTctQqpmhBo4PumwJGcybbnDpxtax3ara3` |
| Reset Launchpad | `REALdpFGDDsiD9tvxYsXBTDpgH1gGQEqJ8YSLdYQWGD` |
| RFQ | `REALFP9S4VmrAixmeYa68FrPKn4NVD2QFxxMfz9arhz` |

## Known Limitations

- **Proxy required in China**: SDK subprocesses use `HTTPS_PROXY` for on-chain RPC calls. Without it, `byreal_open_position` / `byreal_copy_position` will time out.
- **WebSocket confirmations unreliable**: SDK scripts use RPC polling, not ws subscriptions. Confirmation may report "finalized" before the tx actually lands.
- **Tick alignment**: CLMM positions snap to the pool's `tickSpacing`. The SDK handles this automatically — don't pre-align prices.
- **`byreal_pool_info` uses POST**: The `/pools/info/ids` endpoint is a POST endpoint; sending a GET returns empty results.

## Roadmap

### v0.4 ✅ Current
- 38 tools operational
- CLMM open/close/add/remove via SDK subprocesses
- Copy Farm with REFERER_POSITION memo (verified on mainnet)
- Fee collection and reward claim workflows
- CopyFarmer leaderboards and overview
- Wallet onboarding (email OTP + Privy MPC + P-256 auth key)
- Auto-sign for all write operations

### v0.5
- Reset Launchpad integration
- Position auto-rebalance (tick drift detection)
- Portfolio summary (all positions + PnL aggregated)
- Strategy recommendations (optimal range, fee tier selection)
- Transaction spending limits for auto-sign safety
