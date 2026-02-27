/**
 * Swap tools — quote and execute via Byreal Router
 *
 * Router API: POST /byreal/api/router/v1/router-service/swap
 * Actual response: { retCode: 0, result: {
 *   inputMint, outputMint, inAmount, outAmount, otherAmountThreshold,
 *   priceImpactPct, transaction (null for quoteOnly), poolAddresses, routerType
 * }}
 */
import { z } from 'zod';
import { API_ENDPOINTS, apiPost, KNOWN_TOKENS } from '../config.js';
function tokenLabel(mint) {
    return KNOWN_TOKENS[mint]?.symbol || mint.slice(0, 8) + '...';
}
function toUi(rawAmount, mint) {
    const dec = KNOWN_TOKENS[mint]?.decimals ?? 9;
    return Number(rawAmount) / 10 ** dec;
}
export function registerSwapTools(server, chain) {
    server.tool('byreal_swap_quote', 'Get a live swap quote from Byreal Router (no wallet needed). Returns expected output, price impact, minimum received, and which pools will be used.', {
        inputMint: z.string().describe('Input token mint address (e.g. So11... for SOL)'),
        outputMint: z.string().describe('Output token mint address (e.g. EPjF... for USDC)'),
        amount: z.string().describe('Input amount in lamports/smallest unit (e.g. "1000000000" for 1 SOL)'),
        slippageBps: z.number().min(1).max(5000).default(50)
            .describe('Slippage tolerance in basis points (50 = 0.5%)'),
    }, async ({ inputMint, outputMint, amount, slippageBps }) => {
        const data = await apiPost(API_ENDPOINTS.SWAP, {
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
        if (data.routerType)
            lines.push(`Router: ${data.routerType}`);
        if (data.poolAddresses?.length)
            lines.push(`Pool: ${data.poolAddresses.join(', ')}`);
        if (data.cu)
            lines.push(`Estimated CU: ${data.cu}`);
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('byreal_swap_transaction', 'Build a swap transaction via Byreal Router. Returns a base64-encoded Solana VersionedTransaction (unsigned). Must be signed before broadcasting.', {
        inputMint: z.string().describe('Input token mint address'),
        outputMint: z.string().describe('Output token mint address'),
        amount: z.string().describe('Input amount in lamports'),
        slippageBps: z.number().min(1).max(5000).default(100).describe('Slippage in bps'),
        userPublicKey: z.string().describe('User wallet public key (base58)'),
    }, async ({ inputMint, outputMint, amount, slippageBps, userPublicKey }) => {
        const data = await apiPost(API_ENDPOINTS.SWAP, {
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
                content: [{ type: 'text', text: 'Error: Router returned no transaction. Route may be unavailable.' }],
                isError: true,
            };
        }
        const inSym = tokenLabel(inputMint);
        const outSym = tokenLabel(outputMint);
        const outAmt = toUi(data.outAmount, outputMint);
        return {
            content: [{
                    type: 'text',
                    text: [
                        `✅ Transaction built: ${inSym} → ${outAmt.toFixed(6)} ${outSym}`,
                        `Price impact: ${(data.priceImpactPct).toFixed(4)}%`,
                        `Route: ${data.routerType} | Pool: ${(data.poolAddresses || []).join(', ')}`,
                        ``,
                        `Transaction (base64):`,
                        data.transaction,
                        ``,
                        `⚠️ UNSIGNED — sign with your wallet before broadcasting.`,
                    ].join('\n'),
                }],
        };
    });
}
//# sourceMappingURL=swap.js.map