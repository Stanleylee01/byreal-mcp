/**
 * Build an UNSIGNED add-liquidity transaction.
 *
 * Input (env vars):
 *   NFT_MINT       - position NFT mint pubkey
 *   BASE_TOKEN     - "A" or "B"
 *   BASE_AMOUNT    - amount of base token in UI units (e.g. "10")
 *   USER_ADDRESS   - payer/user wallet pubkey
 *   SOL_ENDPOINT   - optional RPC endpoint
 *   SLIPPAGE       - optional slippage (default 0.02)
 *
 * Output (stdout): JSON matching byreal_add_liquidity tool expectations
 */
export {};
