/**
 * Pool query tools — Byreal v2 API
 *
 * v2 response: { records: PoolInfo[], total, pageNum, pageSize, pages }
 * Pool has: mintA/mintB: { mintInfo: {...}, price }, tvl, volumeUsd24h, feeApr24h, feeRate, category, etc.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient, API_ENDPOINTS, apiFetch, apiPost, KNOWN_TOKENS } from '../config.js';

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
}
