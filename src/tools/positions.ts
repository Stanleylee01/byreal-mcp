/**
 * Position tools — Byreal v2 API
 *
 * v2 response: { positions: [...], poolMap: {...}, total }
 * Each position has: poolAddress, nftMintAddress, pnlUsd, earnedUsd, totalDeposit, status, positionAgeMs, etc.
 * poolMap provides pool details (pair, TVL, fee info)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient, API_ENDPOINTS, apiFetch, apiPost } from '../config.js';

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
        const statusLabel = p.status === 0 ? '🟢 Active' : p.status === 1 ? '🔴 Out of range' : `Status ${p.status}`;
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
      depositUsd: z.number().positive().describe('Deposit amount in USD'),
    },
    async ({ poolAddress, depositUsd }) => {
      // Fetch pool info via v2 API
      const data = await apiFetch<{ records: any[] }>(API_ENDPOINTS.POOLS_BY_IDS, {
        ids: poolAddress,
      });

      if (!data?.records?.length) {
        return { content: [{ type: 'text' as const, text: `Pool ${poolAddress} not found` }], isError: true };
      }

      const pool = data.records[0];
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
}
