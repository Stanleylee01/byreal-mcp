#!/usr/bin/env node
/**
 * Byreal DEX MCP Server
 *
 * Full-featured MCP server for Byreal — Solana CLMM DEX
 * Covers: pools, swap, positions, tokens, market data, copyfarmer, orders, klines
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerPoolTools } from './tools/pools.js';
import { registerSwapTools } from './tools/swap.js';
import { registerPositionTools } from './tools/positions.js';
import { registerTokenTools } from './tools/tokens.js';
import { registerMarketTools } from './tools/market.js';
import { registerCopyfarmerTools } from './tools/copyfarmer.js';
import { registerOrderTools } from './tools/orders.js';
import { registerLiquidityTools } from './tools/liquidity.js';
import { registerWalletTools } from './tools/wallet.js';
import { createChain } from './config.js';
const server = new McpServer({
    name: 'byreal-mcp',
    version: '0.4.0',
});
const chain = createChain();
// Register all tool groups
registerPoolTools(server, chain);
registerSwapTools(server, chain);
registerPositionTools(server, chain);
registerTokenTools(server, chain);
registerMarketTools(server, chain);
registerCopyfarmerTools(server, chain);
registerOrderTools(server, chain);
registerLiquidityTools(server, chain);
registerWalletTools(server, chain);
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[byreal-mcp] Server v0.3.0 started on stdio');
}
main().catch((err) => {
    console.error('[byreal-mcp] Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map