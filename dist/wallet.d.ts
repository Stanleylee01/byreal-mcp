/**
 * Wallet module — Privy MPC wallet with email OTP verification
 *
 * Flow:
 * 1. User provides email → send OTP via Resend
 * 2. User enters OTP → verify
 * 3. Create Privy user + Solana wallet
 * 4. Store credentials locally (~/.byreal-mcp/)
 * 5. All write ops auto-sign via Privy
 *
 * Config: ~/.byreal-mcp/config.json (privyAppId, privyAppSecret, resendApiKey)
 * Wallet: ~/.byreal-mcp/wallet.json (userId, walletId, address, email)
 */
export interface WalletConfig {
    privyAppId: string;
    privyAppSecret: string;
    resendApiKey: string;
    resendFrom?: string;
    rpcUrl?: string;
}
export interface WalletInfo {
    userId: string;
    walletId: string;
    address: string;
    email: string;
    createdAt: string;
}
export declare function loadConfig(): WalletConfig | null;
export declare function loadWallet(): WalletInfo | null;
/**
 * Step 1: Send OTP to email
 */
export declare function startVerification(email: string): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Step 2: Verify OTP and create wallet
 */
export declare function verifyAndCreateWallet(code: string): Promise<{
    success: boolean;
    message: string;
    address?: string;
}>;
/**
 * Sign an unsigned base64 transaction and broadcast to Solana
 */
export declare function signAndSend(unsignedTxB64: string): Promise<{
    signature: string;
}>;
/**
 * Get wallet status
 */
export declare function getWalletStatus(): Promise<{
    configured: boolean;
    hasWallet: boolean;
    address?: string;
    email?: string;
    balance?: {
        sol: number;
        usdc: number;
    };
}>;
