# Byreal MCP Full Test Report
Date: 2026-03-05T14:00:19.340Z
Version: 0.6.3

## Summary: 26 passed, 0 failed

## Results
| Tool | Status | Duration | Output |
|------|--------|----------|--------|
| hot_tokens (no param) | ✅ | 588ms | No hot tokens found. |
| hot_tokens (type=1 trending) | ✅ | 106ms | No hot tokens found. |
| hot_tokens (type=2 new) | ✅ | 108ms | No hot tokens found. |
| mint_prices (USDC) | ✅ | 531ms | Token Prices: USDC (EPjFWd...): $0.999800 |
| mint_prices (SOL+USDC) | ✅ | 231ms | Token Prices: USDC (EPjFWd...): $0.999800 SOL (So1111...): $90.860000 |
| list_pools (default) | ✅ | 286ms | Byreal Pools (95 total, page 1/10):  SOL/bbSOL ｜ 87pbGHxigtjdMovzkAAFEe8XFVTETjDomoEFfpSFd2yD   TVL: |
| list_pools (paginated) | ✅ | 184ms | Byreal Pools (95 total, page 1/10):  SOL/bbSOL ｜ 87pbGHxigtjdMovzkAAFEe8XFVTETjDomoEFfpSFd2yD   TVL: |
| market_overview | ✅ | 452ms | 📊 Byreal Market Overview  SOL: $90.8496 bbSOL: $103.2346 USDT: $1.0001 |
| global_overview | ✅ | 105ms | 📊 Byreal Global Overview TVL: $13,458,323 (-1.33%) Volume 24h: $7,756,015 (0.34%) Fees 24h: $8,189  |
| known_tokens | ✅ | 1ms | Known Byreal tokens:  USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (6 decimals) USDT: Es9vMFrz |
| wallet_status | ✅ | 2ms | ⚠️ No wallet found.  Run byreal_wallet_setup to create one. |
| wallet_setup | ✅ | 57ms | ✅ Wallet Created!  Address: TLZdR21WuoyHMGmgL9zM9fChKAGejRbvJjWTJdsN41Y  ⚠️ IMPORTANT — Back up your |
| list_positions (open) | ✅ | 105ms | No positions found for 8r9bADv7UJ7mXgWZXWjZ6R4Ez1Kwdub1AEr3q21sQtVW |
| list_positions (status=0) | ✅ | 105ms | No positions found for 8r9bADv7UJ7mXgWZXWjZ6R4Ez1Kwdub1AEr3q21sQtVW |
| list_positions (closed) | ✅ | 106ms | No positions found for 8r9bADv7UJ7mXgWZXWjZ6R4Ez1Kwdub1AEr3q21sQtVW |
| position_overview | ✅ | 103ms | Position Overview for 8r9bADv7UJ7mXgWZXWjZ6R4Ez1Kwdub1AEr3q21sQtVW:   currentPositionsCount: 0 |
| top_farmers | ✅ | 113ms | 🏆 Top Farmers (3656 total):  #1 All Pools   Farmer: 8pYTu2xY1WemzLMhiuM7UyxHvweEmJVPRfbjDKghMViG    |
| top_positions | ✅ | 2ms | MCP error -32602: Input validation error: Invalid arguments for tool byreal_top_positions: [   {     |
| unclaimed_fees | ✅ | 1ms | MCP error -32602: Input validation error: Invalid arguments for tool byreal_unclaimed_fees: [   {    |
| order_history | ✅ | 110ms | No orders found for 8r9bADv7UJ7mXgWZXWjZ6R4Ez1Kwdub1AEr3q21sQtVW |
| order_history (page=1) | ✅ | 105ms | No orders found for 8r9bADv7UJ7mXgWZXWjZ6R4Ez1Kwdub1AEr3q21sQtVW |
| swap_quote (0.01 SOL string lamports) | ✅ | 103ms | 📊 Byreal Swap Quote 0.01 SOL → 0.908665 USDC Rate: 1 SOL = 90.866500 USDC Min received: 0.904121 US |
| easy_swap dryRun SOL→USDC | ✅ | 104ms | 📊 Quote: 0.01 SOL → 0.908665 USDC Rate: 1 SOL = 90.866500 USDC Min received: 0.904121 USDC (slippag |
| easy_swap dryRun USDC→SOL | ✅ | 103ms | 📊 Quote: 1 USDC → 0.010996 SOL Rate: 1 USDC = 0.010996 SOL Min received: 0.010941 SOL (slippage 0.5 |
| copyfarmer_overview | ✅ | 104ms | CopyFarmer Overview: totalFeeUsd: 2328179.756240693289610281 totalIncentiveUsd: 161937.801530659 tot |
| catalog | ✅ | 2ms | 🗂️  Byreal MCP Tool Catalog (31 tools)  ── Pools ──   byreal_list_pools     List Byreal CLMM pools  |

## Key Issues Found
