/**
 * Market data tools — global overview, mint prices, hot tokens, klines
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ChainClient } from '../config.js';
export declare function registerMarketTools(server: McpServer, chain: ChainClient): void;
