/**
 * Pool query tools — Byreal v2 API
 *
 * v2 response: { records: PoolInfo[], total, pageNum, pageSize, pages }
 * Pool has: mintA/mintB: { mintInfo: {...}, price }, tvl, volumeUsd24h, feeApr24h, feeRate, category, etc.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient, API_ENDPOINTS, apiFetch, apiPost, KNOWN_TOKENS, API_BASE } from '../config.js';

interface V2PoolResp {
  records: any[];
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
}

function fmtPool(p: any): string {
  const symA = p.mintA?.mintInfo?.symbol ?? p.mintA?.symbol ?? '?';
  const symB = p.mintB?.mintInfo?.symbol ?? p.mintB?.symbol ?? '?';
  const feeRate = p.feeRate?.fixFeeRate ? (Number(p.feeRate.fixFeeRate) / 1e6 * 100).toFixed(4) : '?';
  return [
    `${symA}/${symB} | ${p.poolAddress}`,
    `  TVL: $${Number(p.tvl || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
    `  Vol 24h: $${Number(p.volumeUsd24h || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
    `  Fee APR 24h: ${p.feeApr24h ? (Number(p.feeApr24h) * 100).toFixed(4) + '%' : 'N/A'}`,
    `  Fee Rate: ${feeRate}%`,
    `  Price: $${Number(p.mintA?.price || p.price || 0).toFixed(4)}`,
    p.priceChange1d ? `  24h Change: ${(Number(p.priceChange1d) * 100).toFixed(2)}%` : '',
    p.copies !== undefined ? `  Copies: ${p.copies}` : '',
  ].filter(Boolean).join('\n');
}

export function registerPoolTools(server: McpServer, chain: ChainClient) {
  server.tool(
    'byreal_list_pools',
    'List Byreal CLMM pools sorted by TVL, volume, fees, or APR. Returns pool address, pair, TVL, volume, APR, fee rate, price changes.',
    {
      sortField: z.enum(['tvl', 'volumeUsd24h', 'feeUsd24h', 'apr24h']).default('tvl'),
      sortType: z.enum(['asc', 'desc']).default('desc'),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(50).default(10),
    },
    async ({ sortField, sortType, page, pageSize }) => {
      const data = await apiFetch<V2PoolResp>(API_ENDPOINTS.POOLS_LIST, {
        sortField, sortType,
        page: String(page), pageSize: String(pageSize),
      });

      if (!data?.records?.length) {
        return { content: [{ type: 'text' as const, text: 'No pools found.' }] };
      }

      const lines = data.records.map(fmtPool);

      return {
        content: [{
          type: 'text' as const,
          text: `Byreal Pools (${data.total} total, page ${page}/${data.pages}):\n\n${lines.join('\n\n')}`,
        }],
      };
    }
  );

  server.tool(
    'byreal_pool_info',
    'Get detailed info for specific Byreal pool(s) by address (up to 10 at once).',
    {
      poolIds: z.array(z.string()).min(1).max(10).describe('Pool addresses (base58)'),
    },
    async ({ poolIds }) => {
      // POOLS_BY_IDS is a POST endpoint — GET returns empty
      const data = await apiPost<V2PoolResp>(API_ENDPOINTS.POOLS_BY_IDS, {
        ids: poolIds,
      });

      if (!data?.records?.length) {
        return { content: [{ type: 'text' as const, text: 'Pools not found.' }], isError: true };
      }

      return {
        content: [{ type: 'text' as const, text: data.records.map(fmtPool).join('\n\n---\n\n') }],
      };
    }
  );

  server.tool(
    'byreal_pool_live_price',
    'Get live price for a token pair via Byreal Router swap quote.',
    {
      inputMint: z.string().describe('Input token mint'),
      outputMint: z.string().describe('Output token mint'),
    },
    async ({ inputMint, outputMint }) => {
      const dec = KNOWN_TOKENS[inputMint]?.decimals ?? 9;
      const data = await apiPost<any>(API_ENDPOINTS.SWAP, {
        inputMint, outputMint,
        amount: String(10 ** dec),
        swapMode: 'in', slippageBps: '10',
        computeUnitPriceMicroLamports: '50000', quoteOnly: 'true',
      });

      const inSym = KNOWN_TOKENS[inputMint]?.symbol ?? inputMint.slice(0, 8);
      const outSym = KNOWN_TOKENS[outputMint]?.symbol ?? outputMint.slice(0, 8);
      const outDec = KNOWN_TOKENS[outputMint]?.decimals ?? 9;
      const price = Number(data.outAmount) / 10 ** outDec;

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Live: 1 ${inSym} = ${price.toFixed(6)} ${outSym}`,
            `Impact: ${Number(data.priceImpactPct).toFixed(4)}%`,
            `Route: ${data.routerType ?? 'AMM'}`,
            data.poolAddresses?.[0] ? `Pool: ${data.poolAddresses[0]}` : '',
          ].filter(Boolean).join('\n'),
        }],
      };
    }
  );

  // ─── Pool Analyze ────────────────────────────────────────────────────────────

  server.tool(
    'byreal_pool_analyze',
    'Comprehensive pool analysis: volatility, range APR estimates, in-range likelihood, risk factors, and investment projection. Great for deciding where to set price bounds for a new LP position.',
    {
      poolAddress: z.string().describe('Pool address (base58)'),
      amountUsd: z.number().positive().default(1000).describe('Simulated investment in USD (default 1000)'),
      ranges: z.string().default('1,2,3,5,8,10,15,20,35,50')
        .describe('Comma-separated range percentages to analyze (e.g. "1,5,10,20")'),
    },
    async ({ poolAddress, amountUsd, ranges }) => {
      // Parse range percents
      const rangePercents = ranges.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
      if (!rangePercents.length) throw new Error('No valid range percents provided');

      // 1. Pool detail (v2 details endpoint)
      const detailResp = await apiFetch<any>(API_ENDPOINTS.POOL_DETAILS, { id: poolAddress });
      // Pool detail may be nested differently — handle both shapes
      const pool = detailResp?.pool ?? detailResp;

      if (!pool?.poolAddress && !pool?.tvl_usd && !detailResp?.poolAddress) {
        // Fall back to POOLS_BY_IDS
        const fallback = await apiPost<{ records: any[] }>(API_ENDPOINTS.POOLS_BY_IDS, { ids: [poolAddress] });
        if (!fallback?.records?.length) {
          return { content: [{ type: 'text' as const, text: `Pool ${poolAddress} not found` }], isError: true };
        }
        // Use simple pool data
        const p = fallback.records[0];
        return { content: [{ type: 'text' as const, text: `Pool found but detailed analysis requires v2 details endpoint.\n\n${fmtPool(p)}` }] };
      }

      // Normalise field names (v2 detail uses snake_case)
      const tvl = pool.tvl_usd ?? pool.tvl ?? 0;
      const vol24h = pool.volume_24h_usd ?? pool.volumeUsd24h ?? 0;
      const feeRateBps = pool.fee_rate_bps ?? (pool.feeRate?.fixFeeRate ? Number(pool.feeRate.fixFeeRate) / 1e4 : 0);
      const feeRate = feeRateBps / 10000;
      const currentPrice = pool.current_price ?? pool.price ?? 0;
      const dayLow = pool.price_range_24h?.low ?? currentPrice * 0.97;
      const dayHigh = pool.price_range_24h?.high ?? currentPrice * 1.03;
      const dayRangePercent = currentPrice > 0 ? ((dayHigh - dayLow) / currentPrice) * 100 : 0;
      const priceChange24h = pool.price_change_24h ?? 0;
      const symA = pool.token_a?.symbol ?? pool.mintA?.symbol ?? '?';
      const symB = pool.token_b?.symbol ?? pool.mintB?.symbol ?? '?';

      // 2. Fee APR helpers
      const fee24h = vol24h * feeRate;
      const poolFeeApr = tvl > 0 ? (fee24h / tvl) * 365 * 100 : 0;

      // 3. Assess risk helpers
      function tvlRisk(t: number) { return t > 1_000_000 ? 'low' : t >= 100_000 ? 'medium' : 'high'; }
      function volRisk(v: number) { const a = Math.abs(v); return a < 5 ? 'low' : a <= 15 ? 'medium' : 'high'; }
      function inRangeLikelihood(rangeW: number, dayRng: number): 'low' | 'medium' | 'high' {
        if (dayRng <= 0) return 'high';
        if (rangeW > 3 * dayRng) return 'high';
        if (rangeW > 1.5 * dayRng) return 'medium';
        return 'low';
      }

      // 4. Range analysis
      const rangeAnalysis = rangePercents.map(pct => {
        const priceLower = currentPrice * (1 - pct / 100);
        const priceUpper = currentPrice * (1 + pct / 100);
        const rangeWidth = pct * 2; // total width %

        // Concentration multiplier: narrower range → more fees per $ deposited
        // Approx: concentrationMult = 1 / (rangeWidth / 100)
        const concentrationMult = rangeWidth > 0 ? (100 / rangeWidth) : 1;
        const estimatedFeeApr = poolFeeApr * Math.min(concentrationMult, 50); // cap at 50x
        const likelihood = inRangeLikelihood(rangeWidth, dayRangePercent);
        const rebalanceFreq = likelihood === 'high' ? 'low' : likelihood === 'medium' ? 'medium' : 'high';

        // Projected daily fee
        const dailyFeeForDeposit = amountUsd * (estimatedFeeApr / 100) / 365;

        return {
          rangePercent: pct,
          priceLower: priceLower.toFixed(8).replace(/\.?0+$/, ''),
          priceUpper: priceUpper.toFixed(8).replace(/\.?0+$/, ''),
          estimatedFeeApr: `${estimatedFeeApr.toFixed(1)}%`,
          inRangeLikelihood: likelihood,
          rebalanceFrequency: rebalanceFreq,
          dailyFeeUsd: `$${dailyFeeForDeposit.toFixed(4)}`,
        };
      });

      // 5. Risk factors
      const riskFactors: string[] = [];
      if (tvl < 100_000) riskFactors.push(`⚠️  Low TVL ($${tvl.toFixed(0)}) — higher slippage risk`);
      else if (tvl < 1_000_000) riskFactors.push(`ℹ️  Moderate TVL ($${(tvl / 1000).toFixed(0)}K)`);
      else riskFactors.push(`✅ Healthy TVL ($${(tvl / 1_000_000).toFixed(1)}M)`);

      if (dayRangePercent > 10) riskFactors.push(`⚠️  High daily price range (${dayRangePercent.toFixed(2)}%) — significant IL risk`);
      else if (dayRangePercent > 3) riskFactors.push(`ℹ️  Moderate daily range (${dayRangePercent.toFixed(2)}%)`);
      else riskFactors.push(`✅ Stable day range (${dayRangePercent.toFixed(2)}%)`);

      if (Math.abs(priceChange24h) > 15) riskFactors.push(`⚠️  Large 24h price change (${priceChange24h.toFixed(2)}%)`);

      // 6. Investment projection (use 10% range or closest)
      const targetRange = rangePercents.find(p => p >= 10) ?? rangePercents[Math.floor(rangePercents.length / 2)];
      const targetAnalysis = rangeAnalysis.find(r => r.rangePercent === targetRange) ?? rangeAnalysis[0];
      const projectedAprNum = parseFloat(targetAnalysis.estimatedFeeApr);
      const projectedDailyFee = amountUsd * (projectedAprNum / 100) / 365;
      const projectedMonthlyFee = projectedDailyFee * 30;
      const projectedYearlyFee = projectedDailyFee * 365;

      // Format output
      const lines = [
        `🔬 Pool Analysis: ${symA}/${symB}`,
        `   Address: ${poolAddress}`,
        `   Current Price: ${currentPrice > 0 ? currentPrice.toFixed(8).replace(/\.?0+$/, '') : 'N/A'}`,
        `   TVL: $${Number(tvl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        `   Volume 24h: $${Number(vol24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        `   Fee Rate: ${(feeRate * 100).toFixed(4)}%`,
        `   Pool Fee APR (24h): ${poolFeeApr.toFixed(2)}%`,
        `   24h Price Range: ${dayLow.toFixed(6)} – ${dayHigh.toFixed(6)} (${dayRangePercent.toFixed(2)}% swing)`,
        `   24h Price Change: ${priceChange24h.toFixed(2)}%`,
        ``,
        `📊 Range Analysis (deposit: $${amountUsd.toLocaleString()}):`,
        `${'Range%'.padEnd(8)} ${'Price Lower'.padEnd(18)} ${'Price Upper'.padEnd(18)} ${'Est. APR'.padEnd(12)} ${'In-Range'.padEnd(10)} Rebalance`,
        '-'.repeat(90),
        ...rangeAnalysis.map(r =>
          `${String(r.rangePercent + '%').padEnd(8)} ${r.priceLower.padEnd(18)} ${r.priceUpper.padEnd(18)} ${r.estimatedFeeApr.padEnd(12)} ${r.inRangeLikelihood.padEnd(10)} ${r.rebalanceFrequency}`
        ),
        ``,
        `⚠️  Risk Factors:`,
        ...riskFactors.map(f => `   ${f}`),
        ``,
        `💰 Investment Projection (${targetRange}% range, $${amountUsd.toLocaleString()} deposit):`,
        `   Est. APR: ${targetAnalysis.estimatedFeeApr}`,
        `   Daily: $${projectedDailyFee.toFixed(4)}`,
        `   Monthly: $${projectedMonthlyFee.toFixed(2)}`,
        `   Yearly: $${projectedYearlyFee.toFixed(2)}`,
        ``,
        `ℹ️  Note: APR estimates use concentration multiplier. Actual returns depend on in-range time and IL.`,
      ];

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );
}
