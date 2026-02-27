/**
 * Wallet management tools — setup, verify, status, sign
 */
import { z } from 'zod';
import { startVerification, verifyAndCreateWallet, getWalletStatus, signAndSend, } from '../wallet.js';
export function registerWalletTools(server, chain) {
    server.tool('byreal_wallet_setup', 'Start wallet setup: send a verification code to your email. First step of onboarding — no wallet needed yet.', {
        email: z.string().email().describe('Your email address for wallet verification'),
    }, async ({ email }) => {
        try {
            const result = await startVerification(email);
            return {
                content: [{
                        type: 'text',
                        text: result.success
                            ? `📧 ${result.message}\n\nUse byreal_wallet_verify with the 6-digit code from your email.`
                            : `❌ ${result.message}`,
                    }],
                isError: !result.success,
            };
        }
        catch (err) {
            return {
                content: [{ type: 'text', text: `❌ Failed to send verification: ${err.message}` }],
                isError: true,
            };
        }
    });
    server.tool('byreal_wallet_verify', 'Complete wallet setup: enter the 6-digit verification code from your email. Creates a Solana wallet on success.', {
        code: z.string().min(6).max(6).describe('6-digit verification code from email'),
    }, async ({ code }) => {
        try {
            const result = await verifyAndCreateWallet(code);
            if (!result.success) {
                return {
                    content: [{ type: 'text', text: `❌ ${result.message}` }],
                    isError: true,
                };
            }
            return {
                content: [{
                        type: 'text',
                        text: [
                            `✅ Wallet Created!`,
                            ``,
                            `Address: ${result.address}`,
                            ``,
                            `Next steps:`,
                            `1. Send SOL to this address for gas fees (~0.01 SOL minimum)`,
                            `2. Send USDC for trading/LP operations`,
                            `3. Use byreal_wallet_status to check your balance`,
                            ``,
                            `Your wallet is now ready. All trading and LP operations will auto-sign.`,
                        ].join('\n'),
                    }],
            };
        }
        catch (err) {
            return {
                content: [{ type: 'text', text: `❌ Wallet creation failed: ${err.message}` }],
                isError: true,
            };
        }
    });
    server.tool('byreal_wallet_status', 'Check wallet status: address, email, SOL and USDC balance. Also shows if wallet is configured.', {}, async () => {
        try {
            const status = await getWalletStatus();
            if (!status.configured) {
                return {
                    content: [{
                            type: 'text',
                            text: [
                                `⚠️ Wallet not configured.`,
                                ``,
                                `To get started, set these environment variables:`,
                                `  PRIVY_APP_ID=your_privy_app_id`,
                                `  PRIVY_APP_SECRET=your_privy_app_secret`,
                                `  RESEND_API_KEY=your_resend_api_key`,
                                ``,
                                `Or create ~/.byreal-mcp/config.json with these fields.`,
                                `Then run byreal_wallet_setup with your email.`,
                            ].join('\n'),
                        }],
                };
            }
            if (!status.hasWallet) {
                return {
                    content: [{
                            type: 'text',
                            text: `✅ Configured, but no wallet yet. Run byreal_wallet_setup with your email to create one.`,
                        }],
                };
            }
            const bal = status.balance;
            return {
                content: [{
                        type: 'text',
                        text: [
                            `💼 Byreal Wallet`,
                            ``,
                            `Address: ${status.address}`,
                            `Email: ${status.email}`,
                            bal ? `SOL: ${bal.sol.toFixed(6)}` : '',
                            bal ? `USDC: ${bal.usdc.toFixed(2)}` : '',
                            bal ? `Gas: ${bal.sol >= 0.01 ? '✅ Sufficient' : '⚠️ Low — send at least 0.01 SOL'}` : '',
                        ].filter(Boolean).join('\n'),
                    }],
            };
        }
        catch (err) {
            return {
                content: [{ type: 'text', text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    server.tool('byreal_sign_and_send', 'Sign an unsigned base64 transaction with the configured wallet and broadcast to Solana. Returns transaction signature.', {
        unsignedTx: z.string().describe('Base64-encoded unsigned VersionedTransaction'),
    }, async ({ unsignedTx }) => {
        try {
            const result = await signAndSend(unsignedTx);
            return {
                content: [{
                        type: 'text',
                        text: [
                            `✅ Transaction confirmed!`,
                            `Signature: ${result.signature}`,
                            `Explorer: https://solscan.io/tx/${result.signature}`,
                        ].join('\n'),
                    }],
            };
        }
        catch (err) {
            return {
                content: [{ type: 'text', text: `❌ Sign & send failed: ${err.message}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=wallet.js.map