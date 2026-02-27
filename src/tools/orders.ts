/**
 * Order history and position detail tools
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient, apiFetch } from '../config.js';

const API_BASE = process.env.BYREAL_API_BASE || 'https://api2.byreal.io/byreal/api';

export function registerOrderTools(server: McpServer, chain: ChainClient) {

  server.tool(
    'byreal_order_history',
    'Get swap/trade order history for a wallet on Byreal.',
    {
      userAddress: z.string().describe('Wallet public key'),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(50).default(10),
    },
    async ({ userAddress, page, pageSize }) => {
      const data = await apiFetch<any>(`${API_BASE}/dex/v2/order/list`, {
        userAddress, page: String(page), pageSize: String(pageSize),
      });

      const records = data?.records ?? data?.list ?? [];
      if (!records.length) {
        return { content: [{ type: 'text' as const, text: `No orders found for ${userAddress}` }] };
      }

      const lines = records.map((o: any, i: number) => {
        const time = o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 19) : '?';
        return [
          `#${i + 1} ${time}`,
          `  ${o.inputSymbol ?? o.inputMint?.slice(0, 6)} → ${o.outputSymbol ?? o.outputMint?.slice(0, 6)}`,
          `  In: ${o.inputAmount ?? o.inAmount ?? '?'} | Out: ${o.outputAmount ?? o.outAmount ?? '?'}`,
          o.txSignature ? `  Tx: ${o.txSignature}` : '',
        ].filter(Boolean).join('\n');
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Orders for ${userAddress} (${data.total ?? records.length}):\n\n${lines.join('\n\n')}`,
        }],
      };
    }
  );

  server.tool(
    'byreal_position_detail',
    'Get detailed info for a specific LP position by its address.',
    {
      address: z.string().describe('Position address (positionAddress from list)'),
    },
    async ({ address }) => {
      const data = await apiFetch<any>(`${API_BASE}/dex/v2/position/detail`, { address });

      if (!data) {
        return { content: [{ type: 'text' as const, text: `Position ${address} not found.` }], isError: true };
      }

      const lines = [
        `Position: ${data.positionAddress ?? address}`,
        `Pool: ${data.poolAddress ?? '?'}`,
        `NFT: ${data.nftMintAddress ?? '?'}`,
        `Wallet: ${data.walletAddress ?? '?'}`,
        `Status: ${data.status === 0 ? '🟢 Active' : '🔴 Closed'}`,
        `Deposit: $${Number(data.totalDeposit ?? 0).toFixed(2)}`,
        `Liquidity: $${Number(data.liquidityUsd ?? 0).toFixed(2)}`,
        `PnL: $${Number(data.pnlUsd ?? 0).toFixed(4)} (${(Number(data.pnlUsdPercent ?? 0) * 100).toFixed(2)}%)`,
        `Earned Fees: $${Number(data.earnedUsd ?? 0).toFixed(4)}`,
        `Bonus: $${Number(data.bonusUsd ?? 0).toFixed(4)}`,
        `Copies: ${data.copies ?? 0}`,
        data.positionAgeMs ? `Age: ${(Number(data.positionAgeMs) / 86400000).toFixed(1)} days` : '',
        data.upperTick !== undefined ? `Tick range: ${data.lowerTick} — ${data.upperTick}` : '',
      ].filter(Boolean);

      return {
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      };
    }
  );

  server.tool(
    'byreal_position_overview',
    'Get position overview summary for a wallet — total count and aggregated stats.',
    {
      userAddress: z.string().describe('Wallet public key'),
    },
    async ({ userAddress }) => {
      const data = await apiFetch<any>(`${API_BASE}/dex/v2/position/overview`, { userAddress });

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Position Overview for ${userAddress}:`,
            ...Object.entries(data ?? {}).map(([k, v]) => `  ${k}: ${v}`),
          ].join('\n'),
        }],
      };
    }
  );
}
