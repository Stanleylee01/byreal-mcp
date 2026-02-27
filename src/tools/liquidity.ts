/**
 * Liquidity management tools — open/close positions, collect fees, claim rewards
 *
 * Architecture:
 * - Fee collection & reward claims → Server-side API (encode-fee, encode-v3)
 * - Open/close/add/remove liquidity → SDK subprocess (builds unsigned tx)
 *
 * All write operations return unsigned base64 transactions.
 * User must sign externally before broadcasting.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient, apiFetch, apiPost } from '../config.js';
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

export function registerLiquidityTools(server: McpServer, chain: ChainClient) {

  // ==================== Fee Collection (Server-side API) ====================

  server.tool(
    'byreal_unclaimed_fees',
    'Check unclaimed fees and rewards for a wallet. Shows amounts by token for each position.',
    {
      userAddress: z.string().describe('Wallet public key'),
    },
    async ({ userAddress }) => {
      const data = await apiFetch<any>(
        `${API_BASE}/dex/v2/position/unclaimed-v2`,
        { userAddress }
      );

      if (!data?.list?.length && !data?.unclaimedFees?.length) {
        // Also check the old endpoint
        const data2 = await apiFetch<any>(
          `${API_BASE}/dex/v2/position/unclaimed-data`,
          { userAddress }
        );

        const fees = data2?.unclaimedFees ?? [];
        const incentives = data2?.unclaimedOpenIncentives ?? [];

        if (!fees.length && !incentives.length) {
          return { content: [{ type: 'text' as const, text: 'No unclaimed fees or rewards.' }] };
        }

        const feeLines = fees.map((f: any) =>
          `Fee: ${f.amount ?? f.tokenEstA ?? '?'} ${f.tokenSymbol ?? f.tokenAddress?.slice(0, 8) ?? '?'} ($${Number(f.price ?? 0) * Number(f.amount ?? 0)})`
        );
        const incLines = incentives.map((r: any) =>
          `Reward: ${r.amount ?? r.totalTokenAmount ?? '?'} ${r.tokenSymbol ?? '?'}`
        );

        return {
          content: [{
            type: 'text' as const,
            text: `Unclaimed:\n${[...feeLines, ...incLines].join('\n') || 'None'}`,
          }],
        };
      }

      const items = data.list ?? data.unclaimedFees ?? [];
      const lines = items.map((item: any) => {
        const usdVal = (Number(item.amount ?? 0) * Number(item.price ?? 0)).toFixed(4);
        return `${item.tokenSymbol ?? '?'}: ${item.amount ?? '?'} ($${usdVal}) [type: ${item.type ?? '?'}]`;
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Unclaimed Fees & Rewards:\n${lines.join('\n')}`,
        }],
      };
    }
  );

  server.tool(
    'byreal_collect_fees_tx',
    'Build unsigned transaction(s) to collect trading fees from LP positions. Returns base64-encoded transactions to sign.',
    {
      walletAddress: z.string().describe('Wallet public key'),
      positionAddresses: z.array(z.string()).optional()
        .describe('Position addresses to collect from (omit for all positions)'),
    },
    async ({ walletAddress, positionAddresses }) => {
      const body: Record<string, any> = { walletAddress };
      if (positionAddresses?.length) body.positionAddresses = positionAddresses;

      const data = await apiPost<any[]>(
        `${API_BASE}/dex/v2/incentive/encode-fee`,
        body,
      );

      if (!data?.length) {
        return {
          content: [{ type: 'text' as const, text: 'No fees to collect (all positions already claimed).' }],
        };
      }

      const lines = data.map((item: any, i: number) => {
        const tokens = item.tokens ?? [];
        const tokenInfo = tokens.map((t: any) => `${t.symbol ?? '?'}: ${t.amount ?? '?'}`).join(', ');
        return [
          `#${i + 1} Position: ${item.positionAddress}`,
          `  Fees: ${tokenInfo || 'N/A'}`,
          `  Tx: ${item.txPayload?.slice(0, 40)}...`,
        ].join('\n');
      });

      const txPayloads = data.map((item: any) => item.txPayload).filter(Boolean);

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Fee Collection Transactions (${data.length}):`,
            '',
            lines.join('\n\n'),
            '',
            '--- Unsigned Transactions (base64) ---',
            ...txPayloads.map((tx: string, i: number) => `Tx #${i + 1}: ${tx}`),
            '',
            '⚠️ Sign these transactions with your wallet, then submit via byreal_submit_signed_tx',
          ].join('\n'),
        }],
      };
    }
  );

  server.tool(
    'byreal_claim_rewards_tx',
    'Build unsigned transaction(s) to claim incentive rewards or bonus from LP positions.',
    {
      walletAddress: z.string().describe('Wallet public key'),
      positionAddresses: z.array(z.string()).min(1).describe('Position addresses'),
      type: z.number().min(1).max(2).default(1)
        .describe('1 = rewards, 2 = bonus'),
    },
    async ({ walletAddress, positionAddresses, type }) => {
      const data = await apiPost<any>(
        `${API_BASE}/dex/v2/incentive/encode-v3`,
        { walletAddress, positionAddresses, type },
      );

      if (!data?.rewardEncodeItems?.length && !data?.orderCode) {
        return {
          content: [{ type: 'text' as const, text: 'No rewards to claim for these positions.' }],
        };
      }

      const orderCode = data.orderCode;
      const items = data.rewardEncodeItems ?? [];

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Reward Claim (${type === 1 ? 'Rewards' : 'Bonus'})`,
            `Order: ${orderCode}`,
            `Transactions: ${items.length}`,
            '',
            ...items.map((tx: string, i: number) => `Tx #${i + 1}: ${tx}`),
            '',
            `⚠️ Sign all transactions, then submit via byreal_submit_claim with orderCode="${orderCode}"`,
          ].join('\n'),
        }],
      };
    }
  );

  server.tool(
    'byreal_submit_claim',
    'Submit signed reward/bonus claim transactions to Byreal.',
    {
      orderCode: z.string().describe('Order code from byreal_claim_rewards_tx'),
      walletAddress: z.string().describe('Wallet public key'),
      signedTxPayload: z.array(z.string()).describe('Signed transaction payloads (base64)'),
    },
    async ({ orderCode, walletAddress, signedTxPayload }) => {
      const data = await apiPost<any>(
        `${API_BASE}/dex/v2/incentive/order-v3`,
        { orderCode, walletAddress, signedTxPayload },
      );

      return {
        content: [{
          type: 'text' as const,
          text: `Claim submitted! ${JSON.stringify(data)}`,
        }],
      };
    }
  );

  server.tool(
    'byreal_submit_liquidity_tx',
    'Submit signed liquidity transaction (open/close/add/remove position) to Byreal for broadcasting.',
    {
      signedTransactions: z.array(z.string()).describe('Signed transaction(s) as base64'),
    },
    async ({ signedTransactions }) => {
      const data = await apiPost<any>(
        `${API_BASE}/dex/v2/liquidity/send`,
        { data: signedTransactions },
      );

      return {
        content: [{
          type: 'text' as const,
          text: `Transaction submitted! ${JSON.stringify(data)}`,
        }],
      };
    }
  );

  // ==================== Position Operations (SDK-based) ====================

  server.tool(
    'byreal_create_position_info',
    'Get all the information needed to create a new LP position — aligned tick prices, estimated token amounts, and fees. Does NOT build a transaction.',
    {
      poolAddress: z.string().describe('Pool address'),
      priceLower: z.string().describe('Lower price bound (token B per token A)'),
      priceUpper: z.string().describe('Upper price bound (token B per token A)'),
      baseToken: z.enum(['A', 'B']).describe('Which token to use as base (A or B)'),
      baseAmount: z.string().describe('Amount of base token (UI units, e.g. "1.5")'),
    },
    async ({ poolAddress, priceLower, priceUpper, baseToken, baseAmount }) => {
      // Fetch pool details to get token info
      const poolData = await apiFetch<any>(
        `${API_BASE}/dex/v2/pools/details`,
        { poolAddress },
      );

      if (!poolData) {
        return { content: [{ type: 'text' as const, text: `Pool ${poolAddress} not found.` }], isError: true };
      }

      const mintA = poolData.mintA?.mintInfo ?? poolData.mintA;
      const mintB = poolData.mintB?.mintInfo ?? poolData.mintB;
      const symA = mintA?.symbol ?? '?';
      const symB = mintB?.symbol ?? '?';
      const decA = mintA?.decimals ?? 9;
      const decB = mintB?.decimals ?? 6;
      const currentPrice = Number(poolData.mintA?.price ?? poolData.price ?? mintA?.price ?? 0);
      const feeRate = poolData.feeRate?.fixFeeRate ? Number(poolData.feeRate.fixFeeRate) / 1e6 : 0;

      const lower = Number(priceLower);
      const upper = Number(priceUpper);
      const inRange = currentPrice >= lower && currentPrice <= upper;

      // Estimate other token amount (simplified)
      const base = Number(baseAmount);
      let estOther = 0;
      if (baseToken === 'A') {
        // Estimating amount B needed
        estOther = base * currentPrice * (upper - lower) / (upper * lower) * lower;
      } else {
        estOther = base / currentPrice;
      }

      const tvl = Number(poolData.tvl ?? 0);
      const vol24h = Number(poolData.volumeUsd24h ?? 0);
      const depositUsd = baseToken === 'A'
        ? base * currentPrice + estOther
        : base + estOther * currentPrice;

      return {
        content: [{
          type: 'text' as const,
          text: [
            `📋 Position Preview: ${symA}/${symB}`,
            `Pool: ${poolAddress}`,
            `Current price: $${currentPrice.toFixed(6)}`,
            `Your range: ${priceLower} — ${priceUpper}`,
            `In range: ${inRange ? '✅ Yes' : '❌ No'}`,
            ``,
            `Base: ${baseAmount} ${baseToken === 'A' ? symA : symB}`,
            `Est. other: ~${estOther.toFixed(6)} ${baseToken === 'A' ? symB : symA}`,
            `Est. total deposit: ~$${depositUsd.toFixed(2)}`,
            `Fee rate: ${(feeRate * 100).toFixed(4)}%`,
            `Pool TVL: $${tvl.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
            `Pool 24h Vol: $${vol24h.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
            ``,
            `⚠️ To execute: use the Byreal SDK or website to build and sign the transaction.`,
            `The MCP will support direct transaction building in a future update.`,
          ].join('\n'),
        }],
      };
    }
  );

  server.tool(
    'byreal_position_pnl',
    'Get detailed PnL breakdown for a specific position — deposit, withdrawals, fees, rewards, bonus, and net PnL.',
    {
      positionAddress: z.string().describe('Position address'),
    },
    async ({ positionAddress }) => {
      const data = await apiFetch<any>(
        `${API_BASE}/dex/v2/position/detail`,
        { address: positionAddress },
      );

      if (!data) {
        return { content: [{ type: 'text' as const, text: `Position not found.` }], isError: true };
      }

      const pool = data.pool;
      const symA = pool?.mintA?.symbol ?? '?';
      const symB = pool?.mintB?.symbol ?? '?';

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Position PnL: ${symA}/${symB}`,
            `Address: ${data.positionAddress ?? positionAddress}`,
            `Wallet: ${data.providerAddress ?? '?'}`,
            `Status: ${data.status === 0 ? '🟢 Open' : '🔴 Closed'}`,
            ``,
            `Total Deposit: $${Number(data.totalDeposit ?? 0).toFixed(2)}`,
            `Total Withdraw: $${Number(data.totalWithdraw ?? 0).toFixed(2)}`,
            `Claimed Fees+Rewards: $${Number(data.totalClaimedFeeAndReward ?? 0).toFixed(4)}`,
            `Unclaimed Fees+Rewards: $${Number(data.totalUnClaimedFeeAndReward ?? 0).toFixed(4)}`,
            ``,
            `PnL: $${Number(data.pnlUsd ?? 0).toFixed(4)} (${(Number(data.pnlUsdPercent ?? 0) * 100).toFixed(2)}%)`,
            ``,
            data.tokenAFeeInfo ? `Fee A: ${JSON.stringify(data.tokenAFeeInfo)}` : '',
            data.tokenBFeeInfo ? `Fee B: ${JSON.stringify(data.tokenBFeeInfo)}` : '',
            data.bonusInfo ? `Bonus: ${JSON.stringify(data.bonusInfo)}` : '',
            ``,
            `Tick range: ${data.lowerTick} — ${data.upperTick}`,
            data.openTime ? `Opened: ${new Date(data.openTime * 1000).toISOString().slice(0, 10)}` : '',
            data.closeTime ? `Closed: ${new Date(data.closeTime * 1000).toISOString().slice(0, 10)}` : '',
          ].filter(Boolean).join('\n'),
        }],
      };
    }
  );
}
