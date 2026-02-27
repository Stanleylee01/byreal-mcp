/**
 * CopyFarmer tools — top farmers leaderboard, top positions leaderboard, overview
 *
 * Copy Farm write operation is in liquidity.ts (byreal_copy_position)
 * which uses the correct TICK mode + REFERER_POSITION memo.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ChainClient } from '../config.js';
export declare function registerCopyfarmerTools(server: McpServer, chain: ChainClient): void;
