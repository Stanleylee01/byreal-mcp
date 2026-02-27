/**
 * Build an UNSIGNED decrease-liquidity transaction (partial withdrawal).
 *
 * Input (env vars):
 *   NFT_MINT           - position NFT mint pubkey
 *   LIQUIDITY_PERCENT  - percentage to remove (1-100)
 *   USER_ADDRESS       - payer/user wallet pubkey
 *   SOL_ENDPOINT       - optional RPC endpoint
 *   SLIPPAGE           - optional slippage (default 0.02)
 *
 * Output (stdout): JSON matching byreal_remove_liquidity tool expectations
 */
export {};
