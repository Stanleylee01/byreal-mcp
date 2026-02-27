/**
 * Build an UNSIGNED create-position transaction.
 *
 * Input (env vars) — choose prices OR ticks:
 *   POOL_ADDRESS   - pool pubkey
 *   PRICE_LOWER    - lower price (token B per token A) — OR use TICK_LOWER
 *   PRICE_UPPER    - upper price                       — OR use TICK_UPPER
 *   TICK_LOWER     - lower tick index (overrides PRICE_LOWER if set)
 *   TICK_UPPER     - upper tick index (overrides PRICE_UPPER if set)
 *   BASE_TOKEN     - "A" or "B"
 *   BASE_AMOUNT    - amount of base token in UI units (e.g. "1.5")
 *   USER_ADDRESS   - payer/user wallet pubkey
 *   SOL_ENDPOINT   - optional RPC endpoint
 *   SLIPPAGE       - optional slippage (default 0.02)
 *
 * Output (stdout): JSON matching byreal_open_position tool expectations
 */
export {};
