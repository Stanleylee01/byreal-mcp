/**
 * Token info tools
 */
import { z } from 'zod';
import { KNOWN_TOKENS, apiPost } from '../config.js';
const COMMON_PAIRS = [
    {
        inMint: 'So11111111111111111111111111111111111111112',
        outMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
    {
        inMint: 'Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B',
        outMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
    {
        inMint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        outMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
];
const ROUTER_URL = 'https://api2.byreal.io/byreal/api/router/v1/router-service/swap';
export function registerTokenTools(server, chain) {
    server.tool('byreal_token_price', 'Get live USD price of a token available on Byreal. Uses the Router API — no API key needed.', {
        tokenSymbolOrMint: z.string().describe('Token symbol (SOL, USDC, bbSOL, USDT) or mint address'),
    }, async ({ tokenSymbolOrMint }) => {
        // Resolve symbol → mint
        let mint = tokenSymbolOrMint;
        const upper = tokenSymbolOrMint.toUpperCase();
        for (const [addr, info] of Object.entries(KNOWN_TOKENS)) {
            if (info.symbol.toUpperCase() === upper) {
                mint = addr;
                break;
            }
        }
        const tokenInfo = KNOWN_TOKENS[mint];
        const symbol = tokenInfo?.symbol ?? mint.slice(0, 8) + '...';
        const decimals = tokenInfo?.decimals ?? 9;
        // Price in USDC
        const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        if (mint === usdcMint) {
            return { content: [{ type: 'text', text: `${symbol}: $1.000000 (USDC = USD)` }] };
        }
        const data = await apiPost(ROUTER_URL, {
            inputMint: mint,
            outputMint: usdcMint,
            amount: String(10 ** decimals), // 1 unit
            swapMode: 'in',
            slippageBps: '10',
            computeUnitPriceMicroLamports: '50000',
            quoteOnly: 'true',
        });
        const usdPrice = Number(data.outAmount) / 1e6;
        return {
            content: [{
                    type: 'text',
                    text: [
                        `${symbol} Price (Byreal): $${usdPrice.toFixed(6)}`,
                        `Price impact: ${Number(data.priceImpactPct).toFixed(4)}%`,
                        `Route: ${data.routerType ?? 'AMM'}`,
                        data.poolAddresses?.[0] ? `Pool: ${data.poolAddresses[0]}` : '',
                    ].filter(Boolean).join('\n'),
                }],
        };
    });
    server.tool('byreal_market_overview', 'Get a quick market overview of key Byreal token prices. Fetches SOL, bbSOL prices via Router.', {}, async () => {
        const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        const lines = ['📊 Byreal Market Overview\n'];
        for (const { inMint, outMint } of COMMON_PAIRS) {
            if (inMint === usdcMint || outMint === usdcMint) {
                const fromInfo = KNOWN_TOKENS[inMint];
                const toInfo = KNOWN_TOKENS[outMint];
                if (!fromInfo || !toInfo)
                    continue;
                try {
                    const data = await apiPost(ROUTER_URL, {
                        inputMint: inMint,
                        outputMint: outMint,
                        amount: String(10 ** fromInfo.decimals),
                        swapMode: 'in',
                        slippageBps: '10',
                        computeUnitPriceMicroLamports: '50000',
                        quoteOnly: 'true',
                    });
                    const price = Number(data.outAmount) / 10 ** toInfo.decimals;
                    lines.push(`${fromInfo.symbol}: $${price.toFixed(4)}`);
                }
                catch {
                    lines.push(`${fromInfo.symbol}: unavailable`);
                }
            }
        }
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('byreal_known_tokens', 'List all known Byreal tokens with mint addresses and decimals.', {}, async () => {
        const lines = Object.entries(KNOWN_TOKENS).map(([addr, info]) => `${info.symbol}: ${addr} (${info.decimals} decimals)`);
        return {
            content: [{
                    type: 'text',
                    text: `Known Byreal tokens:\n\n${lines.join('\n')}`,
                }],
        };
    });
}
//# sourceMappingURL=tokens.js.map