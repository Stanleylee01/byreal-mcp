/**
 * Position tools — Byreal v2 API
 *
 * v2 response: { positions: [...], poolMap: {...}, total }
 * Each position has: poolAddress, nftMintAddress, pnlUsd, earnedUsd, totalDeposit, status, positionAgeMs, etc.
 * poolMap provides pool details (pair, TVL, fee info)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient, API_ENDPOINTS, apiFetch, apiPost, API_BASE } from '../config.js';

interface V2PositionsResp {
  positions: any[];
  poolMap: Record<string, any>;
  total: number;
  closedPositionRewards: any[];
}

export function registerPositionTools(server: McpServer, chain: ChainClient) {
  server.tool(
    'byreal_list_positions',
    'List all CLMM liquidity positions for a wallet on Byreal. Shows pool pair, PnL, earned fees, deposit, age, and status.',
    {
      walletAddress: z.string().describe('Solana wallet public key (base58)'),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(50).default(20),
    },
    async ({ walletAddress, page, pageSize }) => {
      const data = await apiFetch<V2PositionsResp>(API_ENDPOINTS.MY_POSITIONS, {
        userAddress: walletAddress,
        page: String(page), pageSize: String(pageSize),
      });

      if (!data?.positions?.length) {
        return {
          content: [{ type: 'text' as const, text: `No positions found for ${walletAddress}` }],
        };
      }

      const lines = data.positions.map((p: any, i: number) => {
        const pool = data.poolMap?.[p.poolAddress];
        const symA = pool?.mintA?.symbol ?? '?';
        const symB = pool?.mintB?.symbol ?? '?';
        const statusLabel = p.status === 0 ? '🟢 Active' : p.status === 1 ? '🔴 Out of range' : p.status === 2 ? '⚫ Closed' : `Status ${p.status}`;
        const ageDays = p.positionAgeMs ? (p.positionAgeMs / 86400000).toFixed(1) : '?';

        return [
          `#${i + 1} ${symA}/${symB} (${statusLabel})`,
          `  NFT: ${p.nftMintAddress}`,
          `  Pool: ${p.poolAddress}`,
          `  Deposit: $${Number(p.totalDeposit || 0).toFixed(2)}`,
          `  PnL: $${Number(p.pnlUsd || 0).toFixed(4)} (${(Number(p.pnlUsdPercent || 0) * 100).toFixed(2)}%)`,
          `  Earned Fees: $${Number(p.earnedUsd || 0).toFixed(4)} (${(Number(p.earnedUsdPercent || 0) * 100).toFixed(2)}%)`,
          `  Bonus: $${Number(p.bonusUsd || 0).toFixed(4)}`,
          `  Copies: ${p.copies ?? 0}`,
          `  Age: ${ageDays} days`,
          `  Liquidity: $${Number(p.liquidityUsd || 0).toFixed(2)}`,
        ].join('\n');
      });

      // Summary
      const totalDeposit = data.positions.reduce((s: number, p: any) => s + Number(p.totalDeposit || 0), 0);
      const totalPnl = data.positions.reduce((s: number, p: any) => s + Number(p.pnlUsd || 0), 0);
      const totalEarned = data.positions.reduce((s: number, p: any) => s + Number(p.earnedUsd || 0), 0);

      const summary = [
        `\n📊 Summary (${data.total} positions)`,
        `  Total Deposit: $${totalDeposit.toFixed(2)}`,
        `  Total PnL: $${totalPnl.toFixed(4)}`,
        `  Total Earned Fees: $${totalEarned.toFixed(4)}`,
      ].join('\n');

      return {
        content: [{
          type: 'text' as const,
          text: `Positions for ${walletAddress}:\n\n${lines.join('\n\n')}${summary}`,
        }],
      };
    }
  );

  server.tool(
    'byreal_calculate_apr',
    'Estimate APR for a hypothetical position on a Byreal pool. Uses pool volume and fee data.',
    {
      poolAddress: z.string().describe('Pool address'),
      depositUsd: z.number().positive().default(1000).describe('Deposit amount in USD (default: 1000)'),
    },
    async ({ poolAddress, depositUsd }) => {
      // Fetch pool info via pool details GET endpoint
      const pool = await apiFetch<any>(API_ENDPOINTS.POOL_DETAILS, { poolAddress });

      if (!pool) {
        return { content: [{ type: 'text' as const, text: `Pool ${poolAddress} not found` }], isError: true };
      }
      const symA = pool.mintA?.mintInfo?.symbol ?? '?';
      const symB = pool.mintB?.mintInfo?.symbol ?? '?';
      const tvl = Number(pool.tvl || 0);
      const vol24h = Number(pool.volumeUsd24h || 0);
      const feeRate = pool.feeRate?.fixFeeRate ? Number(pool.feeRate.fixFeeRate) / 1e6 : 0;
      const feeApr = pool.feeApr24h ? Number(pool.feeApr24h) : 0;

      // Pool-wide APR from API
      const dailyFee = vol24h * feeRate;
      const shareOfPool = depositUsd / (tvl + depositUsd);
      const myDailyFee = dailyFee * shareOfPool;
      const estimatedApr = depositUsd > 0 ? (myDailyFee * 365) / depositUsd : 0;

      return {
        content: [{
          type: 'text' as const,
          text: [
            `APR Estimate: ${symA}/${symB}`,
            `Pool TVL: $${tvl.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
            `24h Volume: $${vol24h.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
            `Fee Rate: ${(feeRate * 100).toFixed(4)}%`,
            `Pool Fee APR (Byreal): ${(feeApr * 100).toFixed(4)}%`,
            `Your deposit: $${depositUsd.toLocaleString()}`,
            `Est. daily fees: $${myDailyFee.toFixed(4)}`,
            `Est. APR (full range): ${(estimatedApr * 100).toFixed(2)}%`,
            ``,
            `⚠️ Concentrated LP within a tight range earns more (higher concentration multiplier).`,
          ].join('\n'),
        }],
      };
    }
  );

  // ─── Position Analyze ────────────────────────────────────────────────────────

  server.tool(
    'byreal_position_analyze',
    'Analyze an existing CLMM position: performance (earned%, PnL%, net return), range health (distance to bounds, out-of-range risk), pool context, and unclaimed fee estimates.',
    {
      walletAddress: z.string().describe('Wallet public key (needed to look up the position)'),
      nftMint: z.string().describe('Position NFT mint address'),
    },
    async ({ walletAddress, nftMint }) => {
      // 1. Find position from list API
      const listData = await apiFetch<V2PositionsResp>(API_ENDPOINTS.MY_POSITIONS, {
        userAddress: walletAddress,
        page: '1', pageSize: '100',
      });

      const posItem = listData?.positions?.find((p: any) => p.nftMintAddress === nftMint);
      if (!posItem) {
        return {
          content: [{ type: 'text' as const, text: `Position not found for NFT mint: ${nftMint}\nUse byreal_list_positions to see your NFT mint addresses.` }],
          isError: true,
        };
      }

      // 2. Pool detail — API returns: tvl, volumeUsd24h, feeApr24h, mintA.mintInfo.symbol, mintA.price
      let pool: any = {};
      try {
        pool = await apiFetch<any>(API_ENDPOINTS.POOL_DETAILS, { poolAddress: posItem.poolAddress });
      } catch { /* pool detail is non-critical enrichment */ }

      const currentPrice = Number(pool?.mintA?.price ?? pool?.current_price ?? 0);
      const symbolA = posItem.tokenSymbolA ?? pool?.mintA?.mintInfo?.symbol ?? pool?.token_a?.symbol ?? 'TokenA';
      const symbolB = posItem.tokenSymbolB ?? pool?.mintB?.mintInfo?.symbol ?? pool?.token_b?.symbol ?? 'TokenB';
      const tvlUsd = Number(pool?.tvl ?? pool?.tvl_usd ?? 0);
      const vol24h = Number(pool?.volumeUsd24h ?? pool?.volume_24h_usd ?? 0);
      const apr = Number(pool?.feeApr24h ?? pool?.apr ?? 0);
      const priceChange24h = Number(pool?.price_change_24h ?? 0);

      // 3. Performance from API
      const liquidityUsd = parseFloat(posItem.liquidityUsd || posItem.totalDeposit || '0');
      const earnedUsd = parseFloat(posItem.earnedUsd || '0');
      const pnlUsd = parseFloat(posItem.pnlUsd || '0');
      const bonusUsd = parseFloat(posItem.bonusUsd || '0');
      const netReturnUsd = earnedUsd + pnlUsd;
      const earnedPct = liquidityUsd > 0 ? (earnedUsd / liquidityUsd * 100).toFixed(2) : '0';
      const pnlPct = posItem.pnlUsdPercent
        ? (parseFloat(posItem.pnlUsdPercent) * 100).toFixed(2)
        : liquidityUsd > 0 ? (pnlUsd / liquidityUsd * 100).toFixed(2) : '0';
      const netReturnPct = liquidityUsd > 0 ? (netReturnUsd / liquidityUsd * 100).toFixed(2) : '0';

      // 4. Range health (from API position data — priceLower/priceUpper may be available)
      const priceLower = parseFloat(posItem.priceLower || '0');
      const priceUpper = parseFloat(posItem.priceUpper || '0');
      const inRange = currentPrice > 0 && priceLower > 0 && priceUpper > 0
        ? currentPrice >= priceLower && currentPrice <= priceUpper
        : posItem.status === 0;

      let rangeHealthLines: string[];
      if (priceLower > 0 && priceUpper > 0 && currentPrice > 0) {
        const rangeWidth = priceUpper - priceLower;
        const rangeWidthPct = (rangeWidth / currentPrice) * 100;
        const distToLower = ((currentPrice - priceLower) / currentPrice) * 100;
        const distToUpper = ((priceUpper - currentPrice) / currentPrice) * 100;
        const nearestDist = Math.min(Math.abs(distToLower), Math.abs(distToUpper));
        const oorRisk = !inRange ? 'high' : nearestDist < 2 ? 'high' : nearestDist < 5 ? 'medium' : 'low';

        rangeHealthLines = [
          `  Current Price: ${currentPrice.toFixed(8).replace(/\.?0+$/, '')}`,
          `  Price Lower: ${priceLower.toFixed(8).replace(/\.?0+$/, '')}`,
          `  Price Upper: ${priceUpper.toFixed(8).replace(/\.?0+$/, '')}`,
          `  Range Width: ${rangeWidthPct.toFixed(2)}%`,
          `  Distance to Lower: ${distToLower.toFixed(2)}%`,
          `  Distance to Upper: ${distToUpper.toFixed(2)}%`,
          `  In Range: ${inRange ? '✅ Yes' : '🔴 No'}`,
          `  Out-of-Range Risk: ${oorRisk}`,
        ];
      } else {
        const statusLabel = posItem.status === 0 ? '✅ Active (in-range)' : '🔴 Out of range';
        rangeHealthLines = [
          `  Status: ${statusLabel}`,
          `  Note: Exact price bounds not available in position list API`,
        ];
      }

      // 5. Unclaimed fees estimate (from API — earnedUsd approximates unclaimed if not yet collected)
      const unclaimedFeeLines = [
        `  Combined estimated unclaimed fees: $${bonusUsd > 0 ? (earnedUsd + bonusUsd).toFixed(4) : earnedUsd.toFixed(4)}`,
        bonusUsd > 0 ? `  (includes $${bonusUsd.toFixed(4)} bonus)` : '',
      ].filter(Boolean);

      const lines = [
        `🔍 Position Analysis: ${symbolA}/${symbolB}`,
        `   NFT Mint: ${nftMint}`,
        `   Pool: ${posItem.poolAddress}`,
        ``,
        `📈 Performance:`,
        `  Liquidity (current value): $${liquidityUsd.toFixed(2)}`,
        `  Earned Fees: $${earnedUsd.toFixed(4)} (${earnedPct}%)`,
        `  PnL (IL + price): $${pnlUsd.toFixed(4)} (${pnlPct}%)`,
        `  Net Return: $${netReturnUsd.toFixed(4)} (${netReturnPct}%)`,
        `  Age: ${posItem.positionAgeMs ? (posItem.positionAgeMs / 86400000).toFixed(1) + ' days' : 'N/A'}`,
        ``,
        `🎯 Range Health:`,
        ...rangeHealthLines,
        ``,
        `🏊 Pool Context:`,
        `  Fee APR (24h): ${(apr * 100).toFixed(2)}%`,
        `  Volume 24h: $${Number(vol24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        `  TVL: $${Number(tvlUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        `  24h Price Change: ${priceChange24h.toFixed(2)}%`,
        ``,
        `💰 Unclaimed Fees:`,
        ...unclaimedFeeLines,
      ];

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );
}
