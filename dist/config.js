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
    // Positions (v2)
    MY_POSITIONS: `${API_BASE}/dex/v2/position/list`,
    // Swap (Router)
    SWAP: `${API_BASE}/router/v1/router-service/swap`,
    // Ticks
    TICKS: `${API_BASE}/router/v1/query-service/list-line-position`,
    // Dynamic fee (v2)
    DYNAMIC_FEE: `${API_BASE}/dex/v2/main/auto-fee`,
};
export const KNOWN_TOKENS = {
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6 },
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', decimals: 6 },
    'So11111111111111111111111111111111111111112': { symbol: 'SOL', decimals: 9 },
    'Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B': { symbol: 'bbSOL', decimals: 9 },
};
const RPC_ENDPOINT = process.env.SOL_RPC || process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com';
export function getConnection() {
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
function unwrapResult(json) {
    const code = json.retCode ?? json.ret_code;
    if (code !== undefined) {
        if (code !== 0)
            throw new Error(`Byreal API ${code}: ${json.retMsg || json.ret_msg}`);
        const result = json.result;
        // v2 endpoints wrap in result.data
        if (result?.data !== undefined)
            return result.data;
        return (result ?? json);
    }
    return json;
}
export async function apiFetch(url, params) {
    const u = new URL(url);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            u.searchParams.set(k, v);
        }
    }
    const res = await fetch(u.toString(), {
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok)
        throw new Error(`API ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return unwrapResult(json);
}
export async function apiPost(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error(`API ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return unwrapResult(json);
}
//# sourceMappingURL=config.js.map