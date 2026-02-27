/**
 * Position tools — Byreal v2 API
 *
 * v2 response: { positions: [...], poolMap: {...}, total }
 * Each position has: poolAddress, nftMintAddress, pnlUsd, earnedUsd, totalDeposit, status, positionAgeMs, etc.
 * poolMap provides pool details (pair, TVL, fee info)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ChainClient } from '../config.js';
export declare function registerPositionTools(server: McpServer, chain: ChainClient): void;
