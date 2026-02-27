/**
 * Sign an unsigned base64 transaction via Privy and broadcast to Solana.
 *
 * Input (env vars):
 *   UNSIGNED_TX    - base64 encoded unsigned VersionedTransaction
 *   SOL_ENDPOINT   - optional RPC endpoint
 *
 * Uses sawal's Privy credentials from ~/.sawal/
 *
 * Output (stdout): JSON { signature: string }
 */
export {};
