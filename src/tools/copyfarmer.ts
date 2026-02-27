/**
 * CopyFarmer tools — top farmers, top positions leaderboard, copy position
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient, apiPost, apiFetch } from '../config.js';
import { execSync } from 'child_process';
import * as path from 'path';

const API_BASE = process.env.BYREAL_API_BASE || 'https://api2.byreal.io/byreal/api';
const SDK_DIR = path.resolve(import.meta.dirname ?? __dirname, '../../sdk-ref');

/**
 * Run an SDK script and return its output
 */
function runSdkScript(script: string, env: Record<string, string> = {}): string {
  const fullEnv = {
    ...process.env,
    ...env,
    SOL_ENDPOINT: process.env.SOL_RPC || process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com',
  };

  return execSync(`npx tsx ${script}`, {
    cwd: SDK_DIR,
    env: fullEnv,
    timeout: 30000,
    encoding: 'utf-8',
  });
}

interface TopFarmersResp {
  records: any[];
  poolMap: Record<string, any>;
  total: number;
}

export function registerCopyfarmerTools(server: McpServer, chain: ChainClient) {

  server.tool(
    'byreal_top_farmers',
    'Get the top LP farmers (liquidity providers) on Byreal. Shows total PnL, liquidity, fees earned, copies, and avg APR.',
    {
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(20).default(5),
      poolAddress: z.string().optional().describe('Filter by pool address'),
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
    'Get the top-performing LP positions on Byreal. Shows PnL, deposit, earned fees, liquidity, and age.',
    {
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(20).default(5),
      poolAddress: z.string().optional().describe('Filter by pool address'),
      incentiveOnly: z.boolean().optional().describe('Only show incentivized positions'),
    },
    async ({ page, pageSize, poolAddress, incentiveOnly }) => {
      const body: Record<string, any> = { page, pageSize, sortType: 'desc' };
      if (poolAddress) body.poolAddress = poolAddress;
      if (incentiveOnly !== undefined) body.incentiveOnly = incentiveOnly;

      const data = await apiPost<TopFarmersResp>(
        `${API_BASE}/dex/v2/copyfarmer/top-positions`,
        body,
      );

      if (!data?.records?.length) {
        return { content: [{ type: 'text' as const, text: 'No positions found.' }] };
      }

      const lines = data.records.map((p: any, i: number) => {
        const pool = data.poolMap?.[p.poolAddress];
        const pair = pool
          ? `${pool.mintA?.symbol ?? '?'}/${pool.mintB?.symbol ?? '?'}`
          : p.poolAddress?.slice(0, 8) + '...';
        const ageDays = p.positionAgeMs ? (Number(p.positionAgeMs) / 86400000).toFixed(1) : '?';

        return [
          `#${(page - 1) * pageSize + i + 1} ${pair}`,
          `  Position: ${p.positionAddress}`,
          `  Wallet: ${p.walletAddress}`,
          `  Deposit: $${Number(p.totalDeposit ?? 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
          `  Liquidity: $${Number(p.liquidityUsd ?? 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
          `  PnL: $${Number(p.pnlUsd ?? 0).toLocaleString(undefined, {maximumFractionDigits: 0})} (${(Number(p.pnlUsdPercent ?? 0) * 100).toFixed(2)}%)`,
          `  Fees: $${Number(p.earnedUsd ?? 0).toFixed(2)}`,
          `  Bonus: $${Number(p.bonusUsd ?? 0).toFixed(2)}`,
          `  Copies: ${p.copies ?? 0}`,
          `  Age: ${ageDays}d`,
          `  Status: ${p.status === 0 ? '🟢 Active' : '🔴 Closed'}`,
        ].join('\n');
      });

      return {
        content: [{
          type: 'text' as const,
          text: `🏆 Top Positions (${data.total} total):\n\n${lines.join('\n\n')}`,
        }],
      };
    }
  );

  server.tool(
    'byreal_copyfarmer_overview',
    'Get CopyFarmer program overview stats.',
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

  server.tool(
    'byreal_copy_position',
    'Copy a top farmer\'s position — creates a new position with the same pool, tick range, and proportional amounts. Returns unsigned tx to sign.',
    {
      positionAddress: z.string().describe('Position address to copy (from top positions)'),
      userAddress: z.string().describe('Your wallet public key'),
      depositAmount: z.string().describe('Amount to deposit in base token (raw units, e.g. "1000000" for 1 USDC)'),
      baseToken: z.enum(['A', 'B']).default('A').describe('Which token your depositAmount is in (A or B)'),
      slippage: z.string().optional().describe('Slippage tolerance (default "0.02" = 2%)'),
    },
    async ({ positionAddress, userAddress, depositAmount, baseToken, slippage }) => {
      try {
        // Step 1: Get the position details to copy
        const posData = await apiFetch<any>(
          `${API_BASE}/dex/v2/position/detail`,
          { address: positionAddress },
        );

        if (!posData) {
          return { content: [{ type: 'text' as const, text: `Position ${positionAddress} not found.` }], isError: true };
        }

        if (posData.status !== 0) {
          return { content: [{ type: 'text' as const, text: `Cannot copy closed position. Status: ${posData.status}` }], isError: true };
        }

        const poolAddress = posData.poolAddress ?? posData.pool?.poolAddress;
        const tickLower = posData.lowerTick;
        const tickUpper = posData.upperTick;

        if (!poolAddress || tickLower === undefined || tickUpper === undefined) {
          return { content: [{ type: 'text' as const, text: `Missing position data: poolAddress=${poolAddress}, ticks=${tickLower}-${tickUpper}` }], isError: true };
        }

        // Step 2: Get pool details to convert ticks to prices
        const poolData = await apiFetch<any>(
          `${API_BASE}/dex/v2/pools/details`,
          { poolAddress },
        );

        if (!poolData) {
          return { content: [{ type: 'text' as const, text: `Pool ${poolAddress} not found.` }], isError: true };
        }

        // Get tick spacing and decimals from pool
        const mintA = poolData.mintA?.mintInfo ?? poolData.mintA;
        const mintB = poolData.mintB?.mintInfo ?? poolData.mintB;
        const symA = mintA?.symbol ?? '?';
        const symB = mintB?.symbol ?? '?';

        // Get prices from the original position
        const priceLower = posData.lowerPrice ?? posData.priceLower;
        const priceUpper = posData.upperPrice ?? posData.priceUpper;

        if (!priceLower || !priceUpper) {
          return {
            content: [{
              type: 'text' as const,
              text: `Cannot determine price range from position. Try using byreal_open_position directly with tick values: ${tickLower} - ${tickUpper}`,
            }],
            isError: true,
          };
        }

        // Step 3: Build the create position transaction
        const output = runSdkScript('src/scripts/create-position.ts', {
          POOL_ADDRESS: poolAddress,
          PRICE_LOWER: String(priceLower),
          PRICE_UPPER: String(priceUpper),
          BASE_TOKEN: baseToken,
          BASE_AMOUNT: depositAmount,
          USER_ADDRESS: userAddress,
          SLIPPAGE: slippage || '0.02',
        });

        const result = JSON.parse(output.trim());

        if (result.error) {
          return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }], isError: true };
        }

        const originalWallet = posData.providerAddress ?? posData.walletAddress ?? '?';
        const originalPnl = posData.pnlUsd ?? 0;
        const originalDeposit = posData.totalDeposit ?? 0;

        return {
          content: [{
            type: 'text' as const,
            text: [
              `Copy Position Transaction Built`,
              ``,
              `Copying from: ${positionAddress}`,
              `Original farmer: ${originalWallet}`,
              `Original PnL: $${Number(originalPnl).toFixed(2)} on $${Number(originalDeposit).toFixed(2)} deposit`,
              ``,
              `Your new position:`,
              `  Pool: ${poolAddress} (${symA}/${symB})`,
              `  Price range: ${result.priceLower} — ${result.priceUpper}`,
              `  Tick range: ${result.tickLower} — ${result.tickUpper}`,
              ``,
              `Estimated amounts:`,
              `  Token A (${symA}): ${result.estimatedAmountA}`,
              `  Token B (${symB}): ${result.estimatedAmountB}`,
              ``,
              `NFT Mint (your position address): ${result.nftAddress}`,
              ``,
              `--- Unsigned Transaction (base64) ---`,
              result.unsignedTx,
              ``,
              `Sign this transaction with your wallet, then submit via byreal_submit_liquidity_tx`,
            ].join('\n'),
          }],
        };
      } catch (err: any) {
        const msg = err.stderr || err.message || String(err);
        return { content: [{ type: 'text' as const, text: `Error: ${msg}` }], isError: true };
      }
    }
  );
}
