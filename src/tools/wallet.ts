/**
 * Wallet management tools — setup, status, sign
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ChainClient } from '../config.js';
import {
  setupWallet,
  getWalletStatus,
  signAndSend,
  loadWallet,
} from '../wallet.js';
import { z } from 'zod';

export function registerWalletTools(server: McpServer, chain: ChainClient) {

  server.tool(
    'byreal_wallet_setup',
    'Create a new local Solana wallet (keypair). Generates an Ed25519 keypair and saves it to ~/.byreal-mcp/wallet.json. Only needs to be run once.',
    {},
    async () => {
      try {
        const result = await setupWallet();
        return {
          content: [{
            type: 'text' as const,
            text: result.success
              ? [
                  `✅ Wallet Created!`,
                  ``,
                  `Address: ${result.address}`,
                  ``,
                  `⚠️ IMPORTANT — Back up your wallet file NOW:`,
                  `Private key saved at: ~/.byreal-mcp/wallet.json`,
                  ``,
                  `🔴 If you lose this file, your funds are PERMANENTLY UNRECOVERABLE.`,
                  ``,
                  `Next steps:`,
                  `1. Back up ~/.byreal-mcp/wallet.json to a secure location`,
                  `2. Send SOL to this address for gas fees (~0.01 SOL minimum)`,
                  `3. Send USDC for trading/LP operations`,
                  `4. Use byreal_wallet_status to check your balance`,
                ].join('\n')
              : `❌ ${result.message}`,
          }],
          isError: !result.success,
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: `❌ Wallet setup failed: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'byreal_wallet_status',
    'Check wallet status: address, SOL and USDC balance.',
    {},
    async () => {
      try {
        const status = await getWalletStatus();

        if (!status.hasWallet) {
          return {
            content: [{
              type: 'text' as const,
              text: [
                `⚠️ No wallet found.`,
                ``,
                `Run byreal_wallet_setup to create one.`,
              ].join('\n'),
            }],
          };
        }

        const bal = status.balance;
        return {
          content: [{
            type: 'text' as const,
            text: [
              `💼 Byreal Wallet`,
              ``,
              `Address: ${status.address}`,
              bal ? `SOL: ${bal.sol.toFixed(6)}` : '',
              bal ? `USDC: ${bal.usdc.toFixed(2)}` : '',
              bal ? `Gas: ${bal.sol >= 0.01 ? '✅ Sufficient' : '⚠️ Low — send at least 0.01 SOL'}` : '',
            ].filter(Boolean).join('\n'),
          }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'byreal_sign_and_send',
    'Sign an unsigned base64 transaction with the local wallet keypair and broadcast to Solana. Returns transaction signature.',
    {
      unsignedTx: z.string().describe('Base64-encoded unsigned VersionedTransaction'),
    },
    async ({ unsignedTx }) => {
      try {
        const result = await signAndSend(unsignedTx);
        return {
          content: [{
            type: 'text' as const,
            text: [
              `✅ Transaction confirmed!`,
              `Signature: ${result.signature}`,
              `Explorer: https://solscan.io/tx/${result.signature}`,
            ].join('\n'),
          }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: `❌ Sign & send failed: ${err.message}` }],
          isError: true,
        };
      }
    }
  );
}
