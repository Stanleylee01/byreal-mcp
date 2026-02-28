---
name: byreal-mcp
description: |
  Byreal DEX on Solana — query pools, swap quotes, manage CLMM positions, token prices, market data, top farmers, K-lines.
  Use when user mentions Byreal, CLMM pools, Solana DEX liquidity, or Byreal swap.
---

# Byreal MCP Skill

## What This Is

Byreal is a Solana CLMM (Concentrated Liquidity Market Maker) DEX. This MCP server exposes all Byreal operations as **36 tools** for AI agents, including 3 wallet tools for fully autonomous operation.

CLMM = you set a price range; liquidity only earns fees while the price is inside your range.

## Registration

```bash
# Build first (required)
cd ~/clawd/byreal-mcp && npm run build

# Register with mcporter
mcporter config add byreal --stdio "node ~/clawd/byreal-mcp/dist/index.js"

# Or set env vars for better RPC / proxy
BYREAL_API_BASE=https://api2.byreal.io/byreal/api \
SOL_RPC=https://your-rpc-endpoint.com \
mcporter config add byreal --stdio "node ~/clawd/byreal-mcp/dist/index.js"

# Verify
mcporter list byreal    # should list 36 tools
```

## Quick Test

```bash
mcporter call byreal.byreal_global_overview
mcporter call byreal.byreal_market_overview
mcporter call byreal.byreal_list_pools --args '{"pageSize":5}'
mcporter call byreal.byreal_token_price --args '{"tokenSymbolOrMint":"SOL"}'
```

## Tool Categories

### Pools (read)
- **`byreal_list_pools`** — List pools sorted by TVL/volume/APR. Start here to find active pools.
- **`byreal_pool_info`** — Get TVL/APR/volume for specific pool addresses.
- **`byreal_pool_details`** — Comprehensive single-pool info including price changes.
- **`byreal_pool_live_price`** — Live price for any token pair via Router swap quote.

### Swap
- **`byreal_swap_quote`** — Get quote without wallet. Shows impact, min received, route.
- **`byreal_swap_transaction`** — Build unsigned swap tx. User signs externally.

### Positions (read)
- **`byreal_list_positions`** — All LP positions for a wallet. Shows PnL, fees, status.
- **`byreal_position_detail`** — Details for a specific position by address.
- **`byreal_position_pnl`** — PnL breakdown: deposit, fees, rewards, bonus, net.
- **`byreal_unclaimed_fees`** — Check what's claimable without collecting it.
- **`byreal_create_position_info`** — Preview token amounts before opening a position.
- **`byreal_calculate_apr`** — Estimate APR for a deposit on a given pool.

### Liquidity (write → unsigned tx)
- **`byreal_open_position`** — Open a new CLMM position. Returns unsigned base64 tx.
- **`byreal_close_position`** — Close a position (removes all liquidity). Returns unsigned tx.
- **`byreal_add_liquidity`** — Add more tokens to an existing position.
- **`byreal_remove_liquidity`** — Remove N% of liquidity from a position.
- **`byreal_submit_liquidity_tx`** — Broadcast signed liquidity tx via Byreal API.
- **`byreal_collect_fees_tx`** — Build tx to collect trading fees from positions.
- **`byreal_claim_rewards_tx`** — Build tx to claim incentive rewards or bonuses.
- **`byreal_submit_claim`** — Submit signed reward claim tx (needs orderCode).

### CopyFarmer
- **`byreal_top_farmers`** — Leaderboard of farmers ranked by PnL.
- **`byreal_top_positions`** — Leaderboard of positions ranked by PnL.
- **`byreal_copyfarmer_overview`** — Global CopyFarmer program stats.
- **`byreal_copy_position`** — Copy a top farmer's position tick range. Writes memo with `REFERER_POSITION` for on-chain tracking.

### Market Data
- **`byreal_global_overview`** — DEX-wide TVL, volume, fees (24h + all-time).
- **`byreal_mint_prices`** — Batch price lookup for up to 20 tokens.
- **`byreal_mint_list`** — Search/list tokens available on Byreal.
- **`byreal_hot_tokens`** — Trending tokens.
- **`byreal_kline`** — K-line (OHLCV) data for any token.
- **`byreal_pool_details`** — Also shows price changes (1h/24h/7d).

### Orders & Tokens
- **`byreal_order_history`** — Swap order history for a wallet.
- **`byreal_token_price`** — USD price by symbol (SOL, bbSOL) or mint.
- **`byreal_market_overview`** — Quick snapshot: SOL, bbSOL, USDT prices.
- **`byreal_known_tokens`** — List known mint addresses and decimals.

### Wallet (auto-sign)
- **`byreal_wallet_setup`** — Generate a local Solana keypair. Saved to `~/.byreal-mcp/wallet.json` (chmod 600).
- **`byreal_wallet_status`** — Check wallet address, SOL/USDC balance.
- **`byreal_sign_and_send`** — Sign an unsigned tx with local keypair + broadcast to Solana. Returns signature.

## Wallet Setup

### Config
```bash
bash scripts/setup.sh
# → writes ~/.byreal-mcp/config.json with rpcUrl + heliusApiKey
# → get your free Helius API key at https://helius.dev
```

### Wallet Onboarding Flow
```
byreal_wallet_setup
  → generates local Solana Ed25519 keypair
  → saves to ~/.byreal-mcp/wallet.json (chmod 600)
  → returns wallet address
[Fund the wallet with SOL + target tokens]
```

### Auto-Sign Mode
Once wallet is configured, **all write tools automatically sign and broadcast**:
```
byreal_open_position poolAddress=..., userAddress=..., ...
  → builds tx → auto-signs with local keypair → broadcasts → returns {signature, explorerUrl}
```

No manual signing needed. The `userAddress` must match the configured wallet.

### Wallet Security Model
- **Local keypair**: Standard Solana Ed25519 keypair stored at `~/.byreal-mcp/wallet.json`
- **Self-custodial**: You hold the private key. Export to Phantom or any Solana wallet anytime.
- **Back up wallet.json**: If lost, the wallet and funds are inaccessible. No recovery mechanism.
- **chmod 600**: File permissions restrict access to your user account only.

## Common Workflows

### 0. First-Time Setup (Wallet + Fund)
```
byreal_wallet_setup
  → keypair generated, wallet address returned
byreal_wallet_status
  → shows address, balance
[Fund the wallet with SOL + target tokens]
```

### 1. Check a Pool Before Investing
```
byreal_list_pools (sort by feeApr24h, desc)
  → note poolAddress of a good pool
byreal_pool_details poolAddress=...
  → see full stats, price changes, fee rate
byreal_calculate_apr poolAddress=..., depositUsd=1000
  → estimate your APR
```

### 2. Open a New Position
```
byreal_pool_details poolAddress=...
  → confirm current price and fee rate
byreal_create_position_info poolAddress=..., priceLower=..., priceUpper=..., baseToken=A, baseAmount="100"
  → preview token amounts needed
byreal_open_position poolAddress=..., priceLower=..., priceUpper=..., baseToken=A, baseAmount="100", userAddress=...
  → returns base64 unsigned tx
[User signs with their wallet]
byreal_submit_liquidity_tx signedTransactions=[...]
  → broadcast to Solana
```

### 3. Monitor & Collect Fees
```
byreal_list_positions walletAddress=...
  → check all open positions and PnL
byreal_unclaimed_fees userAddress=...
  → see what's claimable
byreal_collect_fees_tx walletAddress=...
  → build fee collection tx(s)
[Sign each tx]
byreal_submit_liquidity_tx signedTransactions=[...]
```

### 4. Close a Position
```
byreal_list_positions walletAddress=...
  → find nftMintAddress of position to close
byreal_close_position nftMint=..., userAddress=...
  → shows current amounts + fee, returns unsigned tx
[Sign tx]
byreal_submit_liquidity_tx signedTransactions=[...]
```

### 5. Copy Farm Workflow
```
byreal_top_farmers pageSize=5
  → find a profitable farmer (note providerAddress)
byreal_top_positions pageSize=5 (optionally filter by poolAddress)
  → find their best open position (status 🟢, note positionAddress)
byreal_position_detail address=<positionAddress>
  → confirm tick range, pool, PnL
byreal_copy_position positionAddress=..., userAddress=..., baseToken=A, baseAmount="50"
  → build tx with same tick range + REFERER_POSITION memo
[Sign tx]
byreal_submit_liquidity_tx signedTransactions=[...]
```

## Important Concepts

### Unsigned Transaction Workflow
All write operations (open/close/add/remove/swap) build **unsigned** base64 transactions. Two modes:
1. **Auto-sign (wallet configured)**: The tool automatically signs with local keypair and broadcasts. Returns `{signature, explorerUrl}`.
2. **Manual sign (no wallet)**: Returns unsigned base64 tx. Sign externally (Phantom, hardware wallet), then call `byreal_submit_liquidity_tx`.

### Amount Units — UI vs Raw
- `baseAmount` in `byreal_open_position`, `byreal_copy_position`, `byreal_add_liquidity` → **UI units** (e.g. `"50"` = 50 USDC)
- `amount` in `byreal_swap_quote` / `byreal_swap_transaction` → **raw lamports** (e.g. `"1000000000"` = 1 SOL)
- Always use `byreal_known_tokens` to check decimals if unsure

### Tick Alignment
CLMM positions snap to the pool's `tickSpacing`. The SDK handles alignment automatically — pass the desired price as a decimal string (e.g. `"0.985"`) and ticks are computed. Never manually pre-align ticks.

### Slippage
Default slippage is `0.02` (2%). For volatile pairs or wide price ranges, increase to `0.05`. For stablecoin pairs, `0.005` is fine.

### Copy Farm Memo
`byreal_copy_position` passes `REFERER_POSITION=<positionAddress>` to the SDK script, which encodes it as a transaction memo. The Byreal CLMM program reads this memo to attribute your position to the farmer. This is **verified on mainnet**.

### byreal_pool_info is POST
The `/pools/info/ids` endpoint is a POST endpoint. Using GET returns empty results. The tool handles this correctly internally.

## Known Limitations

1. **Proxy in China**: SDK subprocess calls go to `SOL_RPC`. Without `HTTPS_PROXY`, write ops time out in mainland China.
2. **SDK requires Node.js**: The SDK subprocess uses `npx tsx`. Node must be in `PATH`.
3. **WebSocket confirmation**: SDK scripts poll for confirmation; they may report "finalized" slightly early.
4. **Reward claims need orderCode**: `byreal_claim_rewards_tx` returns an `orderCode`. You must include it in `byreal_submit_claim`. Don't lose it.
5. **Position must be open to copy**: `byreal_copy_position` will error if the source position is closed (status ≠ 0).

## Key Addresses

| Item | Address |
|------|---------|
| CLMM Program | `REALQqNEomY6cQGZJUGwywTBD2UmDT32rZcNnfxQ5N2` |
| Router | `REALp6iMBDTctQqpmhBo4PumwJGcybbnDpxtax3ara3` |
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| SOL | `So11111111111111111111111111111111111111112` |
| bbSOL | `Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B` |
