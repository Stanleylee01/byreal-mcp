/**
 * Pool query tools — Byreal v2 API
 *
 * v2 response: { records: PoolInfo[], total, pageNum, pageSize, pages }
 * Pool has: mintA/mintB: { mintInfo: {...}, price }, tvl, volumeUsd24h, feeApr24h, feeRate, category, etc.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ChainClient } from '../config.js';
export declare function registerPoolTools(server: McpServer, chain: ChainClient): void;
