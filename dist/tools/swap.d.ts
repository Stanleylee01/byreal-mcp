/**
 * Swap tools — quote and execute via Byreal Router
 *
 * Router API: POST /byreal/api/router/v1/router-service/swap
 * Actual response: { retCode: 0, result: {
 *   inputMint, outputMint, inAmount, outAmount, otherAmountThreshold,
 *   priceImpactPct, transaction (null for quoteOnly), poolAddresses, routerType
 * }}
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ChainClient } from '../config.js';
export declare function registerSwapTools(server: McpServer, chain: ChainClient): void;
