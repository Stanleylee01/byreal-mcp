/**
 * Byreal chain configuration
 */

import { Connection, PublicKey } from '@solana/web3.js';

// Re-export SDK types we need
// For now we use the API client directly since the SDK needs proper npm install
// In production, import { Chain } from '@byreal/clmm-sdk'

const BYREAL_CLMM_PROGRAM_ID = new PublicKey('REALQqNEomY6cQGZJUGwywTBD2UmDT32rZcNnfxQ5N2');
const BYREAL_ROUTER_PROGRAM_ID = new PublicKey('REALp6iMBDTctQqpmhBo4PumwJGcybbnDpxtax3ara3');

// Byreal API endpoints
export const API_BASE = process.env.BYREAL_API_BASE || 'https://api2.byreal.io/byreal/api';

export const API_ENDPOINTS = {
  // Pool data (v2)
  POOLS_LIST: `${API_BASE}/dex/v2/pools/info/list`,
  POOLS_BY_IDS: `${API_BASE}/dex/v2/pools/info/ids`,
  POOL_DETAILS: `${API_BASE}/dex/v2/pools/details`,
  POOL_KLINES: `${API_BASE}/dex/v2/kline/query-ui`,
  // Positions (v2)
  MY_POSITIONS: `${API_BASE}/dex/v2/position/list`,
  // Swap (Router)
  SWAP: `${API_BASE}/router/v1/router-service/swap`,
  // Ticks
  TICKS: `${API_BASE}/router/v1/query-service/list-line-position`,
  // Dynamic fee (v2)
  DYNAMIC_FEE: `${API_BASE}/dex/v2/main/auto-fee`,
};

export const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', decimals: 6 },
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', decimals: 9 },
  'Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B': { symbol: 'bbSOL', decimals: 9 },
  // Liquid staking
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': { symbol: 'stSOL', decimals: 9 },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'JitoSOL', decimals: 9 },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', decimals: 9 },
  // Bridged assets
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'WETH', decimals: 8 },
  '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh': { symbol: 'WBTC', decimals: 8 },
  // Popular SPL tokens
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', decimals: 5 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', decimals: 6 },
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': { symbol: 'PYTH', decimals: 6 },
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL': { symbol: 'JTO', decimals: 9 },
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk': { symbol: 'WEN', decimals: 5 },
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof': { symbol: 'RENDER', decimals: 8 },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF', decimals: 6 },
  'TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6': { symbol: 'TNSR', decimals: 9 },
  '4SoQ8UkWfeDH47T56PA53CZCeW4KytYCiU65CwBWoJUt': { symbol: 'MNT', decimals: 9 },
  'AymATz4TCL9sWNEEV9Kvyz45CHVhDZ6kUgjTJPzLpU9P': { symbol: 'XAUt0', decimals: 6 },
  'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB': { symbol: 'xTSLA', decimals: 8 },
  'Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh': { symbol: 'xNVDA', decimals: 8 },
};

/**
 * Resolve a token symbol (case-insensitive) or mint address to a mint address.
 * Returns undefined if not found.
 */
export function resolveToken(symbolOrMint: string): string | undefined {
  // Try direct mint lookup first
  if (KNOWN_TOKENS[symbolOrMint]) return symbolOrMint;
  // Try symbol lookup (case-insensitive)
  const upper = symbolOrMint.toUpperCase();
  for (const [mint, info] of Object.entries(KNOWN_TOKENS)) {
    if (info.symbol.toUpperCase() === upper) return mint;
  }
  return undefined;
}

/**
 * Returns decimals for a known mint, defaulting to 9 if unknown.
 */
export function resolveDecimals(mint: string): number {
  return KNOWN_TOKENS[mint]?.decimals ?? 9;
}

const RPC_ENDPOINT = process.env.SOL_RPC || process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com';

export function getConnection(): Connection {
  return new Connection(RPC_ENDPOINT);
}

export function createChain() {
  // Lightweight wrapper — no private key needed for read-only ops
  // For write ops (swap, position), we return unsigned transactions
  const connection = getConnection();
  return {
    connection,
    programId: BYREAL_CLMM_PROGRAM_ID,
    routerProgramId: BYREAL_ROUTER_PROGRAM_ID,
  };
}

export type ChainClient = ReturnType<typeof createChain>;

/**
 * Fetch helper with proxy support
 */
/**
 * Byreal API response format:
 * { retCode: 0, retMsg: '', result: { ... } }
 * For swap: result contains the swap data directly
 */
/**
 * Unwrap Byreal API response.
 * v2 pools/positions: { retCode: 0, result: { success: true, data: { records: [...], total } } }
 * Router swap: { retCode: 0, result: { inputMint, outAmount, ... } }
 */
function unwrapResult<T>(json: any): T {
  const code = json.retCode ?? json.ret_code;
  if (code !== undefined) {
    if (code !== 0) throw new Error(`Byreal API ${code}: ${json.retMsg || json.ret_msg}`);
    const result = json.result;
    // v2 endpoints wrap in result.data
    if (result?.data !== undefined) return result.data as T;
    return (result ?? json) as T;
  }
  return json as T;
}

export async function apiFetch<T>(url: string, params?: Record<string, string>): Promise<T> {
  const u = new URL(url);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      u.searchParams.set(k, v);
    }
  }
  const res = await fetch(u.toString(), {
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const json = await res.json() as any;
  return unwrapResult<T>(json);
}

export async function apiPost<T>(url: string, body: Record<string, any>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const json = await res.json() as any;
  return unwrapResult<T>(json);
}
