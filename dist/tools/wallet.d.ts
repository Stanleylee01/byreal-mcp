/**
 * Wallet management tools — setup, verify, status, sign
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ChainClient } from '../config.js';
export declare function registerWalletTools(server: McpServer, chain: ChainClient): void;
