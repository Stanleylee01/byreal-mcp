/**
 * Swap tools — quote and execute via Byreal Router
 *
 * Router API: POST /byreal/api/router/v1/router-service/swap
 * Actual response: { retCode: 0, result: {
 *   inputMint, outputMint, inAmount, outAmount, otherAmountThreshold,
 *   priceImpactPct, transaction (null for quoteOnly), poolAddresses, routerType
 * }}
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient, API_ENDPOINTS, apiPost, KNOWN_TOKENS, resolveToken } from '../config.js';
import { loadWallet, loadConfig, signAndSend } from '../wallet.js';

interface SwapResult {
  inputMint: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: number;
  inAmount: string;
  transaction: string | null;
  poolAddresses?: string[];
  routerType?: string;
  cu?: string;
}

function tokenLabel(mint: string): string {
  return KNOWN_TOKENS[mint]?.symbol || mint.slice(0, 8) + '...';
}

function toUi(rawAmount: string, mint: string): number {
  const dec = KNOWN_TOKENS[mint]?.decimals ?? 9;
  return Number(rawAmount) / 10 ** dec;
}

export function registerSwapTools(server: McpServer, chain: ChainClient) {
  server.tool(
    'byreal_swap_quote',
    'Get a live swap quote from Byreal Router (no wallet needed). Returns expected output, price impact, minimum received, and which pools will be used.',
    {
      inputMint: z.string().describe('Input token mint address (e.g. So11... for SOL)'),
      outputMint: z.string().describe('Output token mint address (e.g. EPjF... for USDC)'),
      amount: z.string().describe('Input amount in lamports/smallest unit (e.g. "1000000000" for 1 SOL)'),
      slippageBps: z.number().min(1).max(5000).default(50)
        .describe('Slippage tolerance in basis points (50 = 0.5%)'),
    },
    async ({ inputMint, outputMint, amount, slippageBps }) => {
      const data = await apiPost<SwapResult>(API_ENDPOINTS.SWAP, {
        inputMint,
        outputMint,
        amount,
        swapMode: 'in',
        slippageBps: String(slippageBps),
        computeUnitPriceMicroLamports: '50000',
        quoteOnly: 'true',
      });

      const inSym = tokenLabel(inputMint);
      const outSym = tokenLabel(outputMint);
      const inAmt = toUi(data.inAmount, inputMint);
      const outAmt = toUi(data.outAmount, outputMint);
      const minOut = toUi(data.otherAmountThreshold, outputMint);
      const rate = inAmt > 0 ? outAmt / inAmt : 0;

      const lines = [
        `📊 Byreal Swap Quote`,
        `${inAmt} ${inSym} → ${outAmt.toFixed(6)} ${outSym}`,
        `Rate: 1 ${inSym} = ${rate.toFixed(6)} ${outSym}`,
        `Min received: ${minOut.toFixed(6)} ${outSym} (slippage ${slippageBps / 100}%)`,
        `Price impact: ${(data.priceImpactPct).toFixed(4)}%`,
      ];
      if (data.routerType) lines.push(`Router: ${data.routerType}`);
      if (data.poolAddresses?.length) lines.push(`Pool: ${data.poolAddresses.join(', ')}`);
      if (data.cu) lines.push(`Estimated CU: ${data.cu}`);

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );

  server.tool(
    'byreal_swap_transaction',
    'Build a swap transaction via Byreal Router. Returns a base64-encoded Solana VersionedTransaction (unsigned). Must be signed before broadcasting.',
    {
      inputMint: z.string().describe('Input token mint address'),
      outputMint: z.string().describe('Output token mint address'),
      amount: z.string().describe('Input amount in lamports'),
      slippageBps: z.number().min(1).max(5000).default(100).describe('Slippage in bps'),
      userPublicKey: z.string().describe('User wallet public key (base58)'),
    },
    async ({ inputMint, outputMint, amount, slippageBps, userPublicKey }) => {
      const data = await apiPost<SwapResult>(API_ENDPOINTS.SWAP, {
        inputMint,
        outputMint,
        amount,
        swapMode: 'in',
        slippageBps: String(slippageBps),
        computeUnitPriceMicroLamports: '50000',
        userPublicKey,
      });

      if (!data.transaction) {
        return {
          content: [{ type: 'text' as const, text: 'Error: Router returned no transaction. Route may be unavailable.' }],
          isError: true,
        };
      }

      const inSym = tokenLabel(inputMint);
      const outSym = tokenLabel(outputMint);
      const outAmt = toUi(data.outAmount, outputMint);

      // Try auto-sign if wallet is configured
      const config = loadConfig();
      const wallet = loadWallet();
      if (config && wallet) {
        try {
          const result = await signAndSend(data.transaction);
          return {
            content: [{
              type: 'text' as const,
              text: [
                `✅ Swap executed: ${inSym} → ${outAmt.toFixed(6)} ${outSym}`,
                `Price impact: ${(data.priceImpactPct).toFixed(4)}%`,
                `Signature: ${result.signature}`,
                `Explorer: https://solscan.io/tx/${result.signature}`,
              ].join('\n'),
            }],
          };
        } catch (signErr: any) {
          // Auto-sign failed — fall through to return unsigned tx with error note
          console.error('[byreal-mcp] Auto-sign failed:', signErr?.message);
          return {
            content: [{
              type: 'text' as const,
              text: [
                `⚠️ Auto-sign failed: ${signErr?.message ?? 'unknown error'}`,
                ``,
                `Transaction (base64) — sign manually:`,
                data.transaction,
                `Explorer (after manual sign): https://solscan.io`,
              ].join('\n'),
            }],
            isError: true,
          };
        }
      }

      return {
        content: [{
          type: 'text' as const,
          text: [
            `✅ Transaction built: ${inSym} → ${outAmt.toFixed(6)} ${outSym}`,
            `Price impact: ${(data.priceImpactPct).toFixed(4)}%`,
            `Route: ${data.routerType} | Pool: ${(data.poolAddresses || []).join(', ')}`,
            ``,
            `Transaction (base64):`,
            data.transaction,
            ``,
            `⚠️ No wallet configured. Sign manually or run byreal_wallet_setup first.`,
          ].join('\n'),
        }],
      };
    }
  );

  // ─── High-level combo tool ───────────────────────────────────────────────
  server.tool(
    'byreal_easy_swap',
    'One-shot swap using human-friendly token symbols and amounts. Resolves symbols → mints, converts decimals, gets a quote, and auto-executes if a wallet is configured. Example: fromToken="SOL", toToken="USDC", amount="1.5".',
    {
      fromToken: z.string().describe('Input token symbol (e.g. "SOL", "USDC") or mint address'),
      toToken: z.string().describe('Output token symbol (e.g. "USDC", "BONK") or mint address'),
      amount: z.string().describe('Human-readable input amount (e.g. "1.5" for 1.5 SOL)'),
      slippageBps: z.number().min(1).max(5000).default(50)
        .describe('Slippage tolerance in basis points (50 = 0.5%)'),
      dryRun: z.boolean().default(false)
        .describe('If true, return quote only without executing the swap'),
    },
    async ({ fromToken, toToken, amount, slippageBps, dryRun }) => {
      // Resolve symbols to mint addresses
      const inputMint = resolveToken(fromToken) ?? fromToken;
      const outputMint = resolveToken(toToken) ?? toToken;

      if (!KNOWN_TOKENS[inputMint] && inputMint === fromToken) {
        return {
          content: [{ type: 'text' as const, text: `❌ Unknown token: "${fromToken}". Use a mint address or a known symbol (SOL, USDC, USDT, BONK, JUP, WIF, …).` }],
          isError: true,
        };
      }
      if (!KNOWN_TOKENS[outputMint] && outputMint === toToken) {
        return {
          content: [{ type: 'text' as const, text: `❌ Unknown token: "${toToken}". Use a mint address or a known symbol.` }],
          isError: true,
        };
      }

      // Convert human-readable amount to lamports
      const fromDecimals = KNOWN_TOKENS[inputMint]?.decimals ?? 9;
      const rawAmount = Math.round(parseFloat(amount) * 10 ** fromDecimals).toString();

      const inSym = tokenLabel(inputMint);
      const outSym = tokenLabel(outputMint);

      // Step 1: Get quote
      let quoteData: SwapResult;
      try {
        quoteData = await apiPost<SwapResult>(API_ENDPOINTS.SWAP, {
          inputMint,
          outputMint,
          amount: rawAmount,
          swapMode: 'in',
          slippageBps: String(slippageBps),
          computeUnitPriceMicroLamports: '50000',
          quoteOnly: 'true',
        });
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: `❌ Quote failed: ${err.message}` }],
          isError: true,
        };
      }

      const inAmt = toUi(quoteData.inAmount, inputMint);
      const outAmt = toUi(quoteData.outAmount, outputMint);
      const minOut = toUi(quoteData.otherAmountThreshold, outputMint);
      const rate = inAmt > 0 ? outAmt / inAmt : 0;

      const quoteLines = [
        `📊 Quote: ${inAmt} ${inSym} → ${outAmt.toFixed(6)} ${outSym}`,
        `Rate: 1 ${inSym} = ${rate.toFixed(6)} ${outSym}`,
        `Min received: ${minOut.toFixed(6)} ${outSym} (slippage ${slippageBps / 100}%)`,
        `Price impact: ${quoteData.priceImpactPct.toFixed(4)}%`,
      ];
      if (quoteData.routerType) quoteLines.push(`Router: ${quoteData.routerType}`);

      // Step 2: Dry-run mode — return quote only
      if (dryRun) {
        return {
          content: [{
            type: 'text' as const,
            text: [
              ...quoteLines,
              ``,
              `🔍 Dry-run mode — no transaction executed.`,
              `To execute: call again with dryRun=false`,
            ].join('\n'),
          }],
        };
      }

      // Step 3: Try to execute if wallet is available
      const config = loadConfig();
      const wallet = loadWallet();
      if (!config || !wallet) {
        return {
          content: [{
            type: 'text' as const,
            text: [
              ...quoteLines,
              ``,
              `⚠️ No wallet configured — quote only.`,
              ``,
              `💡 Suggestions:`,
              `  1. Run byreal_wallet_setup to create a wallet`,
              `  2. Or use byreal_swap_quote + byreal_sign_and_send for manual flow`,
            ].join('\n'),
          }],
        };
      }

      // Build actual transaction
      let txData: SwapResult;
      try {
        txData = await apiPost<SwapResult>(API_ENDPOINTS.SWAP, {
          inputMint,
          outputMint,
          amount: rawAmount,
          swapMode: 'in',
          slippageBps: String(slippageBps),
          computeUnitPriceMicroLamports: '50000',
          userPublicKey: wallet.publicKey,
        });
      } catch (err: any) {
        return {
          content: [{
            type: 'text' as const,
            text: [
              ...quoteLines,
              ``,
              `❌ Transaction build failed: ${err.message}`,
              ``,
              `💡 Suggestions:`,
              `  1. Check wallet SOL balance with byreal_wallet_status`,
              `  2. Try a smaller amount`,
              `  3. Try byreal_swap_quote to check if the route exists`,
            ].join('\n'),
          }],
          isError: true,
        };
      }

      if (!txData.transaction) {
        return {
          content: [{
            type: 'text' as const,
            text: [
              ...quoteLines,
              ``,
              `❌ Router returned no transaction. Route may be unavailable.`,
              ``,
              `💡 Suggestions:`,
              `  1. Try a different token pair`,
              `  2. Check byreal_list_pools for available liquidity pools`,
              `  3. Use byreal_swap_quote to verify the route first`,
            ].join('\n'),
          }],
          isError: true,
        };
      }

      try {
        const result = await signAndSend(txData.transaction);
        return {
          content: [{
            type: 'text' as const,
            text: [
              ...quoteLines,
              ``,
              `✅ Swap executed!`,
              `Signature: ${result.signature}`,
              `Explorer: https://solscan.io/tx/${result.signature}`,
            ].join('\n'),
          }],
        };
      } catch (err: any) {
        const errMsg = err.message || String(err);
        const suggestions: string[] = [];

        if (errMsg.includes('insufficient') || errMsg.includes('0x1')) {
          suggestions.push(`Check balance: byreal_wallet_status`);
          suggestions.push(`You may need more SOL for gas. Send SOL to your wallet address.`);
        }
        if (errMsg.includes('Blockhash') || errMsg.includes('expired')) {
          suggestions.push(`Network congestion — try again in a few seconds`);
        }
        if (errMsg.includes('slippage') || errMsg.includes('0x1771')) {
          suggestions.push(`Increase slippage: try slippageBps=200 (2%)`);
        }
        if (!suggestions.length) {
          suggestions.push(`Try again — transient RPC errors are common`);
          suggestions.push(`Check byreal_wallet_status to verify your balance`);
        }

        return {
          content: [{
            type: 'text' as const,
            text: [
              ...quoteLines,
              ``,
              `❌ Execution failed: ${errMsg}`,
              ``,
              `💡 Suggestions:`,
              ...suggestions.map(s => `  • ${s}`),
              ``,
              `Transaction (base64) for manual signing:`,
              txData.transaction,
            ].join('\n'),
          }],
          isError: true,
        };
      }
    }
  );
}
