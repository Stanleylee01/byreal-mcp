---
name: byreal-mcp
description: |
  Byreal DEX on Solana — query pools, swap quotes, manage CLMM positions, token prices, market data, top farmers, K-lines.
  Use when user mentions Byreal, CLMM pools, Solana DEX liquidity, or Byreal swap.
---

# Byreal MCP Skill v0.6.2

## What This Is

Byreal is a Solana CLMM (Concentrated Liquidity Market Maker) DEX. This MCP server exposes all Byreal operations as **41 tools** for AI agents, including wallet tools for fully autonomous operation.

CLMM = you set a price range; liquidity only earns fees while the price is inside your range.

## Registration

```bash
# Build first (required)
cd ~/clawd/byreal-mcp && npm run build

# Claude Code
claude mcp add byreal -- node ~/clawd/byreal-mcp/dist/index.js

# mcporter (OpenClaw)
mcporter config add byreal --stdio "node ~/clawd/byreal-mcp/dist/index.js"

# Cursor — add to .cursor/mcp.json:
# { "byreal": { "command": "node", "args": ["~/clawd/byreal-mcp/dist/index.js"] } }

# Verify
mcporter list byreal    # should list 41 tools
```

## Quick Test

```bash
mcporter call byreal.byreal_global_overview
mcporter call byreal.byreal_market_overview
mcporter call byreal.byreal_list_pools --args '{"pageSize":5}'
mcporter call byreal.byreal_pool_analyze --args '{"poolAddress":"9KWAAyaYF7nmMWzirnBmVhE1q4YXPHcXjzfi6YreNtDY","amountUsd":1000}'
mcporter call byreal.byreal_easy_swap --args '{"fromToken":"SOL","toToken":"USDC","amount":"0.01","dryRun":true}'
```

## Tool Categories (41 tools)

### Pools (5)
- **`byreal_list_pools`** — List pools sorted by TVL/volume/APR.
- **`byreal_pool_info`** — Get TVL/APR/volume for specific pool addresses.
- **`byreal_pool_details`** — Comprehensive single-pool info with price changes.
- **`byreal_pool_live_price`** — Live price for any token pair via Router.
- **`byreal_pool_analyze`** ★ — Multi-range APR analysis, risk factors, investment projection. Best tool for LP decisions.

### Swap (3)
- **`byreal_swap_quote`** — Get quote without wallet (raw lamport amounts).
- **`byreal_swap_transaction`** — Build unsigned swap tx (raw amounts, manual sign).
- **`byreal_easy_swap`** ★ — Human-friendly swap: symbol resolution + decimal conversion + auto-sign + `dryRun` mode + error suggestions.

### Positions — Read (8)
- **`byreal_list_positions`** — All LP positions for a wallet with PnL summary.
- **`byreal_position_analyze`** ★ — Position health check with pool context enrichment.
- **`byreal_calculate_apr`** — Estimate APR for a hypothetical deposit.
- **`byreal_position_detail`** — Full detail for a specific position address.
- **`byreal_position_overview`** — Aggregate position stats for a wallet.
- **`byreal_position_pnl`** — PnL breakdown: deposit, fees, rewards, bonus, net.
- **`byreal_unclaimed_fees`** — Check what's claimable without collecting.
- **`byreal_create_position_info`** — Preview token amounts before opening.

### Liquidity — Write (8)
- **`byreal_open_position`** — Open new CLMM position. Supports `amountUsd` for auto token split.
- **`byreal_close_position`** — Close a position and remove all liquidity.
- **`byreal_add_liquidity`** — Add more tokens to existing position.
- **`byreal_remove_liquidity`** — Remove N% of liquidity.
- **`byreal_submit_liquidity_tx`** — Broadcast signed liquidity tx.
- **`byreal_collect_fees_tx`** — Build tx to collect trading fees.
- **`byreal_claim_rewards_tx`** — Build tx to claim incentive rewards.
- **`byreal_submit_claim`** — Submit signed reward claim tx.

### CopyFarmer (5)
- **`byreal_top_farmers`** — Leaderboard of farmers ranked by PnL.
- **`byreal_top_positions`** — Top positions with sortField (liquidity/apr/earned/pnl/copies/bonus) + status filter (open/closed). Best for finding copy targets.
- **`byreal_farmer_positions`** — All positions for a specific farmer.
- **`byreal_copyfarmer_overview`** — Global CopyFarmer program stats.
- **`byreal_copy_position`** — Copy a farmer's tick range. Supports `amountUsd`. Records referral on-chain.

### Market Data (6)
- **`byreal_global_overview`** — DEX-wide TVL, volume, fees (24h + all-time).
- **`byreal_mint_prices`** — Batch price lookup for up to 20 tokens.
- **`byreal_mint_list`** — Search/list tokens available on Byreal.
- **`byreal_hot_tokens`** — Trending tokens.
- **`byreal_kline`** — K-line (OHLCV) candlestick data.
- **`byreal_dynamic_fee`** — Current dynamic fee rates.

### Orders & Tokens (5)
- **`byreal_order_history`** — Swap order history.
- **`byreal_list_orders`** — Active limit orders.
- **`byreal_token_price`** — USD price by symbol or mint.
- **`byreal_market_overview`** — Quick snapshot: SOL, bbSOL, USDT prices.
- **`byreal_known_tokens`** — Known mint addresses and decimals.

### Wallet (3)
- **`byreal_wallet_setup`** — Generate a local Solana keypair (or use `keypairPath` in wallet.json).
- **`byreal_wallet_status`** — Check wallet address, SOL/USDC balance.
- **`byreal_sign_and_send`** — Sign unsigned tx + broadcast. Returns signature.

### Discovery (1)
- **`byreal_catalog`** — List all tools. Search by keyword. Agent self-discovery.

## Wallet Setup

### Config
```bash
bash scripts/setup.sh
# → writes ~/.byreal-mcp/config.json with rpcUrl + heliusApiKey
```

### Wallet — Option A: Generate new
```
byreal_wallet_setup
  → generates Ed25519 keypair → saves to ~/.byreal-mcp/wallet.json
```

### Wallet — Option B: Use existing keypair
Edit `~/.byreal-mcp/wallet.json`:
```json
{ "keypairPath": "/path/to/your/id.json" }
```

### Auto-Sign
Once wallet is configured, all write tools automatically sign and broadcast:
```
byreal_easy_swap → quote → sign with local keypair → broadcast → {signature, explorerUrl}
```

## Common Workflows

### 1. Analyze & Open Position
```
byreal_pool_analyze poolAddress=..., amountUsd=1000, ranges="5,10,20"
  → multi-range APR, risk, projection
byreal_open_position poolAddress=..., priceLower=..., priceUpper=..., amountUsd=100
  → auto-split tokens, build tx, sign, broadcast
```

### 2. Copy a Top Farmer
```
byreal_top_positions poolAddress=..., sortField=earned, pageSize=5
  → find best position
byreal_copy_position positionAddress=..., amountUsd=100
  → replicate tick range + referral memo
```

### 3. Swap with Preview
```
byreal_easy_swap fromToken=SOL, toToken=USDC, amount=1.5, dryRun=true
  → preview quote without executing
byreal_easy_swap fromToken=SOL, toToken=USDC, amount=1.5
  → execute the swap
```

### 4. Monitor Positions
```
byreal_list_positions walletAddress=...
  → all positions with PnL
byreal_position_analyze walletAddress=..., nftMint=...
  → specific position health + pool context
```

## Important Concepts

### Amount Units
- `baseAmount` / `amountUsd` in position tools → **UI units** or **USD**
- `amount` in `byreal_swap_quote` / `byreal_swap_transaction` → **raw lamports**
- `byreal_easy_swap` uses **UI units** (e.g. `"1.5"` = 1.5 SOL)

### amountUsd Auto-Split
Linear price approximation: `ratioA = (pU - pC) / (pU - pL)`. Accurate to ~1-2%.
Below range → all token A. Above range → all token B.

### Error Recovery
All write operations include contextual `💡 Suggestions`:
- Insufficient balance → check wallet + suggest swap
- Blockhash expired → retry
- Slippage → increase bps
- Unknown token → use mint or check known_tokens

## Key Addresses

| Item | Address |
|------|---------|
| CLMM Program | `REALQqNEomY6cQGZJUGwywTBD2UmDT32rZcNnfxQ5N2` |
| Router | `REALp6iMBDTctQqpmhBo4PumwJGcybbnDpxtax3ara3` |
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| SOL | `So11111111111111111111111111111111111111112` |
| bbSOL | `Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B` |

## Known Limitations

1. **Proxy in China**: SDK subprocesses need `HTTPS_PROXY` for RPC calls.
2. **amountUsd is approximate**: Linear interpolation, not full CLMM tick math.
3. **SDK requires Node.js**: Uses `npx tsx`. Node must be in `PATH`.
4. **Reward claims need orderCode**: Don't lose it between `claim_rewards_tx` and `submit_claim`.
