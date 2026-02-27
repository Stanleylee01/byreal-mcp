/**
 * Build an UNSIGNED close-position transaction (remove all liquidity + optionally close NFT).
 *
 * Input (env vars):
 *   NFT_MINT        - position NFT mint pubkey
 *   USER_ADDRESS    - payer/user wallet pubkey
 *   SOL_ENDPOINT    - optional RPC endpoint
 *   SLIPPAGE        - optional slippage (default 0.02)
 *   CLOSE_POSITION  - "false" to keep NFT open (default "true")
 *
 * Output (stdout): JSON matching byreal_close_position tool expectations
 */
export {};
