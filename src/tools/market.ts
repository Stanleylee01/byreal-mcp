/**
 * Market data tools — global overview, mint prices, hot tokens, klines
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient, API_ENDPOINTS, apiFetch, KNOWN_TOKENS } from '../config.js';

const API_BASE = process.env.BYREAL_API_BASE || 'https://api2.byreal.io/byreal/api';

export function registerMarketTools(server: McpServer, chain: ChainClient) {

  server.tool(
    'byreal_global_overview',
    'Get Byreal DEX global stats — total TVL, 24h volume, 24h fees, all-time volume/fees, with change percentages.',
    {},
    async () => {
      const data = await apiFetch<any>(`${API_BASE}/dex/v2/overview/global`);
      return {
        content: [{
          type: 'text' as const,
          text: [
            '📊 Byreal Global Overview',
            `TVL: $${Number(data.tvl).toLocaleString(undefined, {maximumFractionDigits: 0})} (${Number(data.tvlChange).toFixed(2)}%)`,
            `Volume 24h: $${Number(data.volumeUsd24h).toLocaleString(undefined, {maximumFractionDigits: 0})} (${Number(data.volumeUsd24hChange).toFixed(2)}%)`,
            `Fees 24h: $${Number(data.feeUsd24h).toLocaleString(undefined, {maximumFractionDigits: 0})} (${Number(data.feeUsd24hChange).toFixed(2)}%)`,
            `All-time Volume: $${Number(data.volumeAll).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
            `All-time Fees: $${Number(data.feeAll).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
          ].join('\n'),
        }],
      };
    }
  );

  server.tool(
    'byreal_mint_prices',
    'Get current USD prices for one or more tokens by mint address. Fast batch price lookup.',
    {
      mints: z.union([z.string(), z.array(z.string())]).describe('Token mint address(es) — single string or array of up to 20'),
    },
    async ({ mints: rawMints }) => {
      const mints = Array.isArray(rawMints) ? rawMints : [rawMints];
      const data = await apiFetch<Record<string, string>>(
        `${API_BASE}/dex/v2/mint/price`,
        { mints: mints.join(',') }
      );

      const lines = Object.entries(data).map(([mint, price]) => {
        const sym = KNOWN_TOKENS[mint]?.symbol ?? mint.slice(0, 8) + '...';
        return `${sym} (${mint.slice(0, 6)}...): $${Number(price).toFixed(6)}`;
      });

      return {
        content: [{ type: 'text' as const, text: `Token Prices:\n${lines.join('\n')}` }],
      };
    }
  );

  server.tool(
    'byreal_mint_list',
    'Search and list tokens available on Byreal with sorting and filtering.',
    {
      searchKey: z.string().optional().describe('Search by symbol or name'),
      sortField: z.string().optional().describe('Sort field'),
      sort: z.enum(['asc', 'desc']).default('desc'),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(50).default(10),
    },
    async ({ searchKey, sortField, sort, page, pageSize }) => {
      const params: Record<string, string> = {
        sort, page: String(page), pageSize: String(pageSize),
      };
      if (searchKey) params.searchKey = searchKey;
      if (sortField) params.sortField = sortField;

      const data = await apiFetch<any>(`${API_BASE}/dex/v2/mint/list`, params);
      const records = data?.records ?? data?.list ?? [];

      if (!records.length) {
        return { content: [{ type: 'text' as const, text: 'No tokens found.' }] };
      }

      const lines = records.map((m: any) => {
        return `${m.symbol ?? '?'} | ${m.address ?? m.mint ?? '?'} | $${Number(m.price ?? 0).toFixed(6)}`;
      });

      return {
        content: [{ type: 'text' as const, text: `Tokens (${data.total ?? records.length}):\n${lines.join('\n')}` }],
      };
    }
  );

  server.tool(
    'byreal_hot_tokens',
    'Get trending/hot tokens on Byreal.',
    {
      type: z.number().optional().describe('Hot token type (omit for default trending list)'),
    },
    async ({ type }) => {
      const params: Record<string, string> = {};
      if (type !== undefined) params.type = String(type);
      const data = await apiFetch<any>(`${API_BASE}/dex/v2/mint/hot`, params);
      const items = Array.isArray(data) ? data : data?.records ?? data?.list ?? [];

      if (!items.length) {
        return { content: [{ type: 'text' as const, text: 'No hot tokens found.' }] };
      }

      const lines = items.map((m: any) =>
        `${m.symbol ?? '?'} | $${Number(m.price ?? 0).toFixed(6)} | ${m.address ?? m.mint ?? '?'}`
      );

      return {
        content: [{ type: 'text' as const, text: `🔥 Hot Tokens:\n${lines.join('\n')}` }],
      };
    }
  );

  server.tool(
    'byreal_kline',
    'Get K-line (candlestick) data for a token or pool on Byreal. Pass either poolAddress OR tokenAddress (token mint). Use interval for the candle period.',
    {
      poolAddress: z.string().optional().describe('Pool address — preferred when querying a specific trading pair'),
      tokenAddress: z.string().optional().describe('Token mint address — use if you only have the token, not pool'),
      interval: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']).default('1h').describe('Candle interval (e.g. "1h", "1d")'),
      startTime: z.number().optional().describe('Start timestamp (seconds)'),
      endTime: z.number().optional().describe('End timestamp (seconds)'),
    },
    async ({ poolAddress, tokenAddress, interval, startTime, endTime }) => {
      if (!poolAddress && !tokenAddress) {
        return { content: [{ type: 'text' as const, text: 'Error: provide either poolAddress or tokenAddress' }], isError: true };
      }

      const params: Record<string, string> = { klineType: interval };
      if (startTime) params.startTime = String(startTime);
      if (endTime) params.endTime = String(endTime);

      let data: any;
      if (poolAddress) {
        params.poolAddress = poolAddress;
        data = await apiFetch<any>(`${API_BASE}/dex/v2/kline/query`, params);
      } else {
        params.tokenAddress = tokenAddress!;
        data = await apiFetch<any>(`${API_BASE}/dex/v2/chart/k-line`, params);
      }

      const items = Array.isArray(data) ? data : data?.records ?? data?.list ?? [];

      if (!items.length) {
        return { content: [{ type: 'text' as const, text: 'No K-line data found.' }] };
      }

      const sym = tokenAddress ? (KNOWN_TOKENS[tokenAddress]?.symbol ?? tokenAddress.slice(0, 8)) : poolAddress?.slice(0, 8);
      const lines = items.slice(-10).map((k: any) => {
        if (typeof k === 'object') {
          return `${k.time ?? k.t ?? '?'} O:${k.open ?? k.o} H:${k.high ?? k.h} L:${k.low ?? k.l} C:${k.close ?? k.c} V:${k.volume ?? k.v ?? '?'}`;
        }
        return String(k);
      });

      return {
        content: [{
          type: 'text' as const,
          text: `K-line ${sym} (${interval}, last ${Math.min(items.length, 10)} candles):\n${lines.join('\n')}`,
        }],
      };
    }
  );

  server.tool(
    'byreal_pool_details',
    'Get comprehensive details for a single pool — includes TVL, volume, fees, kline data, and token info.',
    {
      poolAddress: z.string().describe('Pool address'),
    },
    async ({ poolAddress }) => {
      const data = await apiFetch<any>(`${API_BASE}/dex/v2/pools/details`, { poolAddress });

      if (!data) {
        return { content: [{ type: 'text' as const, text: `Pool ${poolAddress} not found.` }], isError: true };
      }

      const symA = data.mintA?.mintInfo?.symbol ?? data.mintA?.symbol ?? '?';
      const symB = data.mintB?.mintInfo?.symbol ?? data.mintB?.symbol ?? '?';
      const feeRate = data.feeRate?.fixFeeRate ? (Number(data.feeRate.fixFeeRate) / 1e6 * 100).toFixed(4) : '?';

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Pool: ${poolAddress}`,
            `Pair: ${symA}/${symB}`,
            `TVL: $${Number(data.tvl ?? 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
            `Volume 24h: $${Number(data.volumeUsd24h ?? 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
            `Fees 24h: $${Number(data.feeUsd24h ?? 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`,
            `Fee APR: ${data.feeApr24h ? (Number(data.feeApr24h) * 100).toFixed(4) + '%' : 'N/A'}`,
            `Fee Rate: ${feeRate}%`,
            `Price: $${Number(data.price ?? data.mintA?.price ?? 0).toFixed(6)}`,
            data.priceChange1h ? `1h: ${(Number(data.priceChange1h) * 100).toFixed(2)}%` : '',
            data.priceChange1d ? `24h: ${(Number(data.priceChange1d) * 100).toFixed(2)}%` : '',
            data.priceChange7d ? `7d: ${(Number(data.priceChange7d) * 100).toFixed(2)}%` : '',
            `Total Bonus: $${Number(data.totalBonus ?? 0).toFixed(2)}`,
            `Category: ${data.category ?? 'N/A'}`,
          ].filter(Boolean).join('\n'),
        }],
      };
    }
  );
}
