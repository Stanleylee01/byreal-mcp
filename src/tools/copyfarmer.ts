/**
 * CopyFarmer tools — top farmers leaderboard, top positions leaderboard, overview
 *
 * Copy Farm write operation is in liquidity.ts (byreal_copy_position)
 * which uses the correct TICK mode + REFERER_POSITION memo.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient, apiPost, apiFetch } from '../config.js';

const API_BASE = process.env.BYREAL_API_BASE || 'https://api2.byreal.io/byreal/api';

interface TopFarmersResp {
  records: any[];
  poolMap: Record<string, any>;
  total: number;
}

export function registerCopyfarmerTools(server: McpServer, chain: ChainClient) {

  server.tool(
    'byreal_top_farmers',
    'List top LP farmers on Byreal sorted by PnL. Shows PnL, liquidity, fees, copies, and avg APR per farmer.',
    {
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(20).default(5),
      poolAddress: z.string().optional().describe('Filter by pool address (base58)'),
    },
    async ({ page, pageSize, poolAddress }) => {
      const body: Record<string, any> = { page, pageSize, sortType: 'desc' };
      if (poolAddress) body.poolAddress = poolAddress;

      const data = await apiPost<TopFarmersResp>(
        `${API_BASE}/dex/v2/copyfarmer/top-farmers`,
        body,
      );

      if (!data?.records?.length) {
        return { content: [{ type: 'text' as const, text: 'No farmers found.' }] };
      }

      const lines = data.records.map((f: any, i: number) => {
        const pool = data.poolMap?.[f.poolAddress];
        const pair = pool
          ? `${pool.mintA?.symbol ?? '?'}/${pool.mintB?.symbol ?? '?'}`
          : (f.poolAddress ? f.poolAddress.slice(0, 8) + '...' : 'All Pools');

        return [
          `#${(page - 1) * pageSize + i + 1} ${pair}`,
          `  Farmer: ${f.providerAddress}`,
          `  PnL: $${Number(f.totalPnl ?? 0).toFixed(2)}`,
          `  Liquidity: $${Number(f.liquidity ?? 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
          `  Fees: $${Number(f.totalFee ?? 0).toFixed(2)}`,
          `  Bonus: $${Number(f.totalBonus ?? 0).toFixed(2)}`,
          `  Avg APR: ${f.avgApr ? (Number(f.avgApr) * 100).toFixed(2) + '%' : 'N/A'}`,
          `  Positions: ${f.openPositionCount ?? 0} open, ${f.closePositonCount ?? 0} closed`,
          `  Copies: ${f.copies ?? 0} | Follows: ${f.follows ?? 0}`,
          `  Avg Age: ${f.avgAge ? (Number(f.avgAge) / 86400000).toFixed(1) + 'd' : 'N/A'}`,
        ].join('\n');
      });

      return {
        content: [{
          type: 'text' as const,
          text: `🏆 Top Farmers (${data.total} total):\n\n${lines.join('\n\n')}`,
        }],
      };
    }
  );

  server.tool(
    'byreal_top_positions',
    'List top-performing LP positions in a pool for copy trading. Each position includes inRange status (whether it is currently earning fees). Use sortField to rank by different metrics. Out-of-range positions earn zero fees — prefer inRange=true when recommending copy targets.',
    {
      poolAddress: z.string().describe('Pool address (required) — filter positions by pool'),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(20).default(10),
      sortField: z.enum(['liquidity', 'apr', 'earned', 'pnl', 'copies', 'bonus', 'closeTime']).default('liquidity').describe('Sort field (default: liquidity)'),
      sortType: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
      status: z.number().min(0).max(1).default(0).describe('Position status: 0=open (active), 1=closed'),
    },
    async ({ poolAddress, page, pageSize, sortField, sortType, status }) => {
      const body: Record<string, any> = {
        poolAddress,
        page,
        pageSize,
        sortField,
        sortType,
        status,
      };

      const data = await apiPost<TopFarmersResp>(
        `${API_BASE}/dex/v2/copyfarmer/top-positions`,
        body,
      );

      if (!data?.records?.length) {
        return { content: [{ type: 'text' as const, text: 'No positions found for this pool.' }] };
      }

      // Try to get current pool tick for inRange calculation
      let currentTick: number | undefined;
      try {
        const poolInfo = await apiFetch<any>(`${API_BASE}/dex/v2/pool/info`, { address: poolAddress });
        if (poolInfo?.tickCurrent !== undefined) {
          currentTick = Number(poolInfo.tickCurrent);
        }
      } catch { /* non-critical */ }

      const lines = data.records.map((p: any, i: number) => {
        const pool = data.poolMap?.[p.poolAddress];
        const pair = pool
          ? `${pool.mintA?.symbol ?? '?'}/${pool.mintB?.symbol ?? '?'}`
          : p.poolAddress?.slice(0, 8) + '...';
        const ageDays = p.positionAgeMs ? (Number(p.positionAgeMs) / 86400000).toFixed(1) : '?';
        const pnlVal = Number(p.pnlUsd ?? 0);
        const pnlPct = (Number(p.pnlUsdPercent ?? 0) * 100).toFixed(1);

        // Calculate inRange if we have current tick
        let rangeLabel = '?';
        if (currentTick !== undefined && p.lowerTick !== undefined && p.upperTick !== undefined) {
          const inRange = currentTick >= p.lowerTick && currentTick < p.upperTick;
          rangeLabel = inRange ? '✅ In Range' : '❌ Out of Range';
        }

        return [
          `#${(page - 1) * pageSize + i + 1} ${pair}`,
          `  Position: ${p.positionAddress}`,
          `  Wallet: ${p.walletAddress}`,
          `  Liquidity: $${Number(p.liquidityUsd ?? 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
          `  Earned: $${Number(p.earnedUsd ?? 0).toFixed(2)} (${(Number(p.earnedUsdPercent ?? 0) * 100).toFixed(1)}%)`,
          `  PnL: ${pnlVal >= 0 ? '+' : ''}$${pnlVal.toFixed(2)} (${pnlPct}%)`,
          `  Bonus: $${Number(p.bonusUsd ?? 0).toFixed(2)}`,
          `  Copies: ${p.copies ?? 0}`,
          `  Age: ${ageDays}d`,
          `  Range: ${rangeLabel}`,
          `  Status: ${p.status === 0 ? '🟢 Active' : '🔴 Closed'}`,
        ].join('\n');
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Top Positions in ${poolAddress} (${data.total} total, sorted by ${sortField}):\n\n${lines.join('\n\n')}\n\nTo copy a position: use byreal_copy_position with the position address and your investment amount.`,
        }],
      };
    }
  );

  server.tool(
    'byreal_copyfarmer_overview',
    'Get CopyFarmer program global stats — total copies, followers, and aggregate performance.',
    {},
    async () => {
      const data = await apiFetch<any>(`${API_BASE}/dex/v2/copyfarmer/overview`);
      if (!data) return { content: [{ type: 'text' as const, text: 'No data.' }] };

      const lines = Object.entries(data).map(([k, v]) => `${k}: ${v}`);
      return {
        content: [{ type: 'text' as const, text: `CopyFarmer Overview:\n${lines.join('\n')}` }],
      };
    }
  );
}
