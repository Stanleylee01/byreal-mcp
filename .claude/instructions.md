# Byreal MCP — Claude Code Instructions

You have access to Byreal DEX tools via MCP. Byreal is a Solana CLMM (Concentrated Liquidity) DEX.

## What You Can Do

**Read operations (no wallet needed):**
- Query pools, APR, TVL → `byreal_list_pools`, `byreal_pool_details`
- Check token prices → `byreal_token_price`, `byreal_mint_prices`
- View positions → `byreal_list_positions`, `byreal_position_pnl`
- Market overview → `byreal_global_overview`, `byreal_hot_tokens`
- Top farmers → `byreal_top_farmers`, `byreal_top_positions`

**Write operations (wallet required):**
- Open/close LP positions → `byreal_open_position`, `byreal_close_position`
- Add/remove liquidity → `byreal_add_liquidity`, `byreal_remove_liquidity`
- Swap tokens → `byreal_swap_transaction`
- Copy farm → `byreal_copy_position`
- Collect fees → `byreal_collect_fees_tx`

## Rules

1. **Read ops: just do it.** No wallet check needed.
2. **Write ops: check wallet first.** Call `byreal_wallet_status` once. If no wallet, guide user through setup (see below).
3. **Don't ask unnecessary questions.** If the user says "查看 SOL/USDC 池子", just call the tool.
4. **Amounts are UI units.** `baseAmount="50"` means 50 tokens, not lamports. Exception: `byreal_swap_quote` uses raw lamports.
5. **Default slippage: 0.02** (2%). Stablecoins: 0.005. Volatile: 0.05.

## Wallet Setup (only when user wants write operations)

```
Step 1: byreal_wallet_setup → sends OTP to email
Step 2: byreal_wallet_verify → verifies OTP, creates wallet
Step 3: User funds wallet with SOL (gas) + tokens
```

⚠️ After wallet creation, remind user to **back up `~/.byreal-mcp/auth_key.pem`** — losing it = permanent wallet loss.

## Common Tasks

### "查看池子" / "看看哪个池子好"
→ `byreal_list_pools` (sort by feeApr24h, pageSize=10)

### "我的仓位" / "查看仓位"
→ Ask for wallet address, then `byreal_list_positions`

### "开个仓位"
→ `byreal_wallet_status` → `byreal_pool_details` → `byreal_create_position_info` (preview) → `byreal_open_position`

### "抄一个大户"
→ `byreal_top_farmers` → `byreal_top_positions` → `byreal_position_detail` → `byreal_copy_position`

### "价格"
→ `byreal_token_price` or `byreal_market_overview`

## Key Addresses
- USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- SOL: `So11111111111111111111111111111111111111112`
- bbSOL: `Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B`
