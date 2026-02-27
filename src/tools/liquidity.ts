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
 * Run an SDK script and return its parsed JSON output
 */
function runSdkScript(script: string, env: Record<string, string> = {}): string {
  const fullEnv = {
    ...process.env,
    ...env,
    SOL_ENDPOINT: process.env.SOL_RPC || process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com',
  };

  return execSync(`npx tsx --import ./src/scripts/proxy-setup.ts ${script}`, {
    cwd: SDK_DIR,
    env: fullEnv,
    timeout: 60000,
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

  // ==================== Position Operations (SDK-based, transaction building) ====================

  server.tool(
    'byreal_open_position',
    'Build an unsigned transaction to open a new CLMM LP position. Returns base64 tx to sign.',
    {
      poolAddress: z.string().describe('Pool address'),
      priceLower: z.string().describe('Lower price bound (token B per token A)'),
      priceUpper: z.string().describe('Upper price bound (token B per token A)'),
      baseToken: z.enum(['A', 'B']).describe('Which token to use as base (A or B)'),
      baseAmount: z.string().describe('Amount of base token (raw units, e.g. "1000000" for 1 USDC)'),
      userAddress: z.string().describe('User wallet public key'),
      slippage: z.string().optional().describe('Slippage tolerance (default "0.02" = 2%)'),
    },
    async ({ poolAddress, priceLower, priceUpper, baseToken, baseAmount, userAddress, slippage }) => {
      try {
        const output = runSdkScript('src/scripts/create-position.ts', {
          POOL_ADDRESS: poolAddress,
          PRICE_LOWER: priceLower,
          PRICE_UPPER: priceUpper,
          BASE_TOKEN: baseToken,
          BASE_AMOUNT: baseAmount,
          USER_ADDRESS: userAddress,
          SLIPPAGE: slippage || '0.02',
        });

        const result = JSON.parse(output.trim());

        if (result.error) {
          return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }], isError: true };
        }

        return {
          content: [{
            type: 'text' as const,
            text: [
              `Open Position Transaction Built`,
              ``,
              `Pool: ${result.poolAddress}`,
              `Token A: ${result.mintA}`,
              `Token B: ${result.mintB}`,
              `Price range: ${result.priceLower} — ${result.priceUpper}`,
              `Tick range: ${result.tickLower} — ${result.tickUpper}`,
              ``,
              `Estimated amounts:`,
              `  Token A: ${result.estimatedAmountA}`,
              `  Token B: ${result.estimatedAmountB}`,
              ``,
              `NFT Mint (position address): ${result.nftAddress}`,
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
        return { content: [{ type: 'text' as const, text: `SDK Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    'byreal_close_position',
    'Build an unsigned transaction to close a CLMM position (remove all liquidity and close). Returns base64 tx to sign.',
    {
      nftMint: z.string().describe('Position NFT mint address'),
      userAddress: z.string().describe('User wallet public key'),
      slippage: z.string().optional().describe('Slippage tolerance (default "0.02" = 2%)'),
      closePosition: z.boolean().optional().describe('Whether to close the position account (default true)'),
    },
    async ({ nftMint, userAddress, slippage, closePosition }) => {
      try {
        const output = runSdkScript('src/scripts/close-position.ts', {
          NFT_MINT: nftMint,
          USER_ADDRESS: userAddress,
          SLIPPAGE: slippage || '0.02',
          CLOSE_POSITION: closePosition === false ? 'false' : 'true',
        });

        const result = JSON.parse(output.trim());

        if (result.error) {
          return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }], isError: true };
        }

        const pos = result.positionInfo;
        return {
          content: [{
            type: 'text' as const,
            text: [
              `Close Position Transaction Built`,
              ``,
              `Position NFT: ${pos.nftMint}`,
              `Pool: ${pos.poolAddress}`,
              `Token A: ${pos.mintA}`,
              `Token B: ${pos.mintB}`,
              ``,
              `Position details:`,
              `  Price range: ${pos.priceLower} — ${pos.priceUpper}`,
              `  Current amount A: ${pos.amountA}`,
              `  Current amount B: ${pos.amountB}`,
              `  Unclaimed fee A: ${pos.feeAmountA}`,
              `  Unclaimed fee B: ${pos.feeAmountB}`,
              `  Close position: ${pos.closePosition}`,
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
        return { content: [{ type: 'text' as const, text: `SDK Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    'byreal_add_liquidity',
    'Build an unsigned transaction to add liquidity to an existing CLMM position. Returns base64 tx to sign.',
    {
      nftMint: z.string().describe('Position NFT mint address'),
      baseToken: z.enum(['A', 'B']).describe('Which token to use as base (A or B)'),
      baseAmount: z.string().describe('Amount of base token (raw units, e.g. "1000000" for 1 USDC)'),
      userAddress: z.string().describe('User wallet public key'),
      slippage: z.string().optional().describe('Slippage tolerance (default "0.02" = 2%)'),
    },
    async ({ nftMint, baseToken, baseAmount, userAddress, slippage }) => {
      try {
        const output = runSdkScript('src/scripts/add-liquidity.ts', {
          NFT_MINT: nftMint,
          BASE_TOKEN: baseToken,
          BASE_AMOUNT: baseAmount,
          USER_ADDRESS: userAddress,
          SLIPPAGE: slippage || '0.02',
        });

        const result = JSON.parse(output.trim());

        if (result.error) {
          return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }], isError: true };
        }

        const pos = result.positionInfo;
        return {
          content: [{
            type: 'text' as const,
            text: [
              `Add Liquidity Transaction Built`,
              ``,
              `Position NFT: ${pos.nftMint}`,
              `Pool: ${pos.poolAddress}`,
              `Price range: ${pos.priceLower} — ${pos.priceUpper}`,
              ``,
              `Current position:`,
              `  Token A: ${pos.currentAmountA}`,
              `  Token B: ${pos.currentAmountB}`,
              ``,
              `Adding:`,
              `  Token A: ${result.estimatedAmountA}`,
              `  Token B: ${result.estimatedAmountB}`,
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
        return { content: [{ type: 'text' as const, text: `SDK Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    'byreal_remove_liquidity',
    'Build an unsigned transaction to remove partial liquidity from a CLMM position. Returns base64 tx to sign.',
    {
      nftMint: z.string().describe('Position NFT mint address'),
      liquidityPercent: z.number().min(1).max(100).describe('Percentage of liquidity to remove (1-100)'),
      userAddress: z.string().describe('User wallet public key'),
      slippage: z.string().optional().describe('Slippage tolerance (default "0.02" = 2%)'),
    },
    async ({ nftMint, liquidityPercent, userAddress, slippage }) => {
      try {
        const output = runSdkScript('src/scripts/decrease-liquidity.ts', {
          NFT_MINT: nftMint,
          LIQUIDITY_PERCENT: String(liquidityPercent),
          USER_ADDRESS: userAddress,
          SLIPPAGE: slippage || '0.02',
        });

        const result = JSON.parse(output.trim());

        if (result.error) {
          return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }], isError: true };
        }

        const pos = result.positionInfo;
        return {
          content: [{
            type: 'text' as const,
            text: [
              `Remove Liquidity Transaction Built`,
              ``,
              `Position NFT: ${pos.nftMint}`,
              `Pool: ${pos.poolAddress}`,
              `Price range: ${pos.priceLower} — ${pos.priceUpper}`,
              ``,
              `Current position:`,
              `  Token A: ${pos.currentAmountA}`,
              `  Token B: ${pos.currentAmountB}`,
              ``,
              `Removing ${result.liquidityPercent}% of liquidity:`,
              `  Expected Token A: ~${result.expectedAmountA}`,
              `  Expected Token B: ~${result.expectedAmountB}`,
              `  Liquidity: ${result.liquidityToRemove} / ${result.totalLiquidity}`,
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
        return { content: [{ type: 'text' as const, text: `SDK Error: ${msg}` }], isError: true };
      }
    }
  );

  // ==================== Copy Farm (replicate a top position) ====================

  server.tool(
    'byreal_copy_position',
    'Copy a top farmer\'s position: look up an existing position by address and build an unsigned tx to replicate it for your wallet. Returns base64 tx to sign.',
    {
      positionAddress: z.string().describe('Address of the position to copy'),
      userAddress:     z.string().describe('Your wallet public key (payer)'),
      baseToken:       z.enum(['A', 'B']).default('A').optional().describe('Which token to use as the input (default A)'),
      baseAmount:      z.string().describe('Amount of base token in UI units (e.g. "50" for $50 of Token A)'),
      slippage:        z.string().optional().describe('Slippage tolerance (default "0.02" = 2%)'),
    },
    async ({ positionAddress, userAddress, baseToken = 'A', baseAmount, slippage }) => {
      // Step 1: Look up position details from Byreal API
      let posDetail: any;
      try {
        posDetail = await apiFetch<any>(
          `${API_BASE}/dex/v2/position/detail`,
          { address: positionAddress },
        );
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Failed to fetch position: ${e.message}` }], isError: true };
      }

      if (!posDetail?.pool) {
        return { content: [{ type: 'text' as const, text: 'Position not found or has no pool data.' }], isError: true };
      }

      const pool   = posDetail.pool ?? {};
      const symA   = pool.mintA?.mintInfo?.symbol ?? pool.mintA?.symbol ?? 'TokenA';
      const symB   = pool.mintB?.mintInfo?.symbol ?? pool.mintB?.symbol ?? 'TokenB';
      const poolAddress = pool.poolAddress ?? posDetail.poolAddress ?? pool.address;

      // Get tick range from the position
      const tickLower = posDetail.lowerTick;
      const tickUpper = posDetail.upperTick;

      if (tickLower === undefined || tickUpper === undefined || !poolAddress) {
        return {
          content: [{ type: 'text' as const, text: `Position ${positionAddress} missing tick/pool data. Lower: ${tickLower}, Upper: ${tickUpper}, Pool: ${poolAddress}` }],
          isError: true,
        };
      }

      // Step 2: Build open position tx with same pool+range (using TICK mode)
      let result: any;
      try {
        const output = runSdkScript('src/scripts/create-position.ts', {
          POOL_ADDRESS:  poolAddress,
          TICK_LOWER:    String(tickLower),
          TICK_UPPER:    String(tickUpper),
          BASE_TOKEN:    baseToken,
          BASE_AMOUNT:   baseAmount,
          USER_ADDRESS:  userAddress,
          SLIPPAGE:      slippage || '0.02',
        });
        result = JSON.parse(output.trim());
      } catch (err: any) {
        const msg = err.stderr || err.message || String(err);
        return { content: [{ type: 'text' as const, text: `SDK Error building tx: ${msg}` }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: [
            `📋 Copy Position — ${symA}/${symB}`,
            ``,
            `Copying: ${positionAddress}`,
            `Original farmer: ${posDetail.providerAddress ?? '?'}`,
            `Original PnL: $${Number(posDetail.pnlUsd ?? 0).toFixed(2)} (${(Number(posDetail.pnlUsdPercent ?? 0) * 100).toFixed(2)}%)`,
            ``,
            `Your new position:`,
            `Pool: ${poolAddress}`,
            `Price range: ${result.priceLower} — ${result.priceUpper}`,
            `Ticks: ${result.tickLower} — ${result.tickUpper}`,
            `Est. ${symA}: ${result.estimatedAmountA}`,
            `Est. ${symB}: ${result.estimatedAmountB}`,
            `NFT address: ${result.nftAddress}`,
            ``,
            `--- Unsigned Transaction (base64) ---`,
            result.unsignedTx,
            ``,
            `Sign this transaction with your wallet, then submit via byreal_submit_liquidity_tx`,
          ].join('\n'),
        }],
      };
    }
  );
}
