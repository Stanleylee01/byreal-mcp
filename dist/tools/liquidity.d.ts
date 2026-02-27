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
import { ChainClient } from '../config.js';
export declare function registerLiquidityTools(server: McpServer, chain: ChainClient): void;
