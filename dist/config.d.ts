/**
 * Byreal chain configuration
 */
import { Connection, PublicKey } from '@solana/web3.js';
export declare const API_BASE: string;
export declare const API_ENDPOINTS: {
    POOLS_LIST: string;
    POOLS_BY_IDS: string;
    MY_POSITIONS: string;
    SWAP: string;
    TICKS: string;
    DYNAMIC_FEE: string;
};
export declare const KNOWN_TOKENS: Record<string, {
    symbol: string;
    decimals: number;
}>;
export declare function getConnection(): Connection;
export declare function createChain(): {
    connection: Connection;
    programId: PublicKey;
    routerProgramId: PublicKey;
};
export type ChainClient = ReturnType<typeof createChain>;
export declare function apiFetch<T>(url: string, params?: Record<string, string>): Promise<T>;
export declare function apiPost<T>(url: string, body: Record<string, any>): Promise<T>;
