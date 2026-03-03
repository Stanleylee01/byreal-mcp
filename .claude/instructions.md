# Byreal MCP v0.6 — Claude Code Instructions

You have access to **41 Byreal DEX tools** via MCP. Byreal is a Solana CLMM (Concentrated Liquidity) DEX.

## What You Can Do

**Read operations (no wallet needed):**
- Query pools, APR, TVL → `byreal_list_pools`, `byreal_pool_details`
- Analyze pools for LP → `byreal_pool_analyze` (multi-range APR, risk factors)
- Check token prices → `byreal_token_price`, `byreal_mint_prices`
- View positions → `byreal_list_positions`, `byreal_position_analyze`
- Market overview → `byreal_global_overview`, `byreal_hot_tokens`, `byreal_kline`
- Top farmers & positions → `byreal_top_farmers`, `byreal_top_positions`
- Discover tools → `byreal_catalog` (search by keyword)

**Write operations (wallet required):**
- Open/close LP positions → `byreal_open_position`, `byreal_close_position`
- Add/remove liquidity → `byreal_add_liquidity`, `byreal_remove_liquidity`
- Swap tokens → `byreal_easy_swap` (human-friendly) or `byreal_swap_transaction` (raw)
- Copy farm → `byreal_copy_position`
- Collect fees → `byreal_collect_fees_tx`
- Sign & send → `byreal_sign_and_send`

## Rules

1. **Read ops: just do it.** No wallet check needed.
2. **Write ops: check wallet first.** Call `byreal_wallet_status` once. If no wallet, guide user through setup.
3. **Don't ask unnecessary questions.** If the user says "查看 SOL/USDC 池子", just call the tool.
4. **Use `byreal_easy_swap` for swaps.** It handles symbol resolution, decimal conversion, and auto-signing. Use `dryRun=true` for preview.
5. **Use `amountUsd` for positions.** When user says "$100", use `amountUsd=100` instead of making them calculate token amounts.
6. **Amounts are UI units** (except `byreal_swap_quote` which uses raw lamports).
7. **Default slippage: 0.02** (2%). Stablecoins: 0.005. Volatile: 0.05.
8. **No external API keys needed.** Wallet is a local Solana keypair.

## Wallet Setup

```
Step 1: byreal_wallet_setup → generates local keypair
   OR: edit ~/.byreal-mcp/wallet.json → { "keypairPath": "/path/to/id.json" }
Step 2: User funds wallet with SOL (gas) + tokens
```
⚠️ Remind user to **back up their wallet** — losing it = permanent fund loss.

## Common Tasks

### "查看池子" / "看看哪个池子好"
→ `byreal_list_pools` (sort by feeApr24h)
→ For deeper analysis: `byreal_pool_analyze` with amountUsd

### "我的仓位" / "仓位健康吗"
→ `byreal_list_positions` for overview
→ `byreal_position_analyze` for specific position health

### "换点 USDC" / "把 SOL 换成 USDC"
→ `byreal_easy_swap({ fromToken: "SOL", toToken: "USDC", amount: "1.5" })`
→ Preview: add `dryRun: true`

### "投 100 美金开个仓"
→ `byreal_pool_analyze` → pick pool
→ `byreal_open_position({ ..., amountUsd: 100 })` — auto-splits tokens

### "抄一个大户"
→ `byreal_top_positions({ poolAddress: "...", sortField: "earned" })`
→ `byreal_copy_position({ positionAddress: "...", amountUsd: 100 })`

### "价格" / "SOL 多少钱"
→ `byreal_token_price` or `byreal_market_overview`

### "有什么工具"
→ `byreal_catalog` or `byreal_catalog({ query: "swap" })`

## Key Addresses
- USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- SOL: `So11111111111111111111111111111111111111112`
- bbSOL: `Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B`
- USDT: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`

## Error Handling

All write operations include `💡 Suggestions` on failure:
- Insufficient balance → suggests `byreal_wallet_status` + `byreal_easy_swap`
- Blockhash expired → retry
- Slippage failure → increase `slippageBps`
- Unknown token → use mint address or check `byreal_known_tokens`

## Important Notes

- `byreal_pool_analyze` is the best tool for LP decisions (shows APR × concentration for each range width)
- `byreal_easy_swap` is preferred over `byreal_swap_quote` + `byreal_swap_transaction` (does everything in one call)
- `amountUsd` uses linear price approximation (~1-2% accuracy), not full CLMM tick math
- CopyFarmer: `byreal_top_positions` supports `sortField` (liquidity/apr/earned/pnl/copies/bonus) and `status` (0=open, 1=closed)
- Proxy (`HTTPS_PROXY`) needed in China for SDK subprocess RPC calls
