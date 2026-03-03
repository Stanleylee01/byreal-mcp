/**
 * Catalog tool — AI agent discovery
 * Returns a structured list of all available MCP tools with descriptions and parameters.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChainClient } from '../config.js';

interface ToolEntry {
  name: string;
  description: string;
  params: string;
  category: string;
}

const TOOL_CATALOG: ToolEntry[] = [
  // ── Pools ──────────────────────────────────────────────────────────────────
  {
    category: 'Pools',
    name: 'byreal_list_pools',
    description: 'List Byreal CLMM pools sorted by TVL, volume, fees, or APR.',
    params: 'sortField, sortType, page, pageSize',
  },
  {
    category: 'Pools',
    name: 'byreal_pool_info',
    description: 'Get detailed info for specific pool(s) by address (up to 10 at once).',
    params: 'poolIds: string[]',
  },
  {
    category: 'Pools',
    name: 'byreal_pool_live_price',
    description: 'Get live price for a token pair via Byreal Router swap quote.',
    params: 'inputMint, outputMint',
  },
  {
    category: 'Pools',
    name: 'byreal_pool_analyze',
    description: 'Comprehensive pool analysis: volatility, range APR estimates, in-range likelihood, risk factors, and investment projection. Best tool for deciding LP price bounds.',
    params: 'poolAddress, amountUsd (default 1000), ranges (default "1,2,3,5,8,10,15,20,35,50")',
  },
  // ── Positions ──────────────────────────────────────────────────────────────
  {
    category: 'Positions',
    name: 'byreal_list_positions',
    description: 'List all CLMM liquidity positions for a wallet. Shows pair, PnL, earned fees, deposit, age, status.',
    params: 'walletAddress, page, pageSize',
  },
  {
    category: 'Positions',
    name: 'byreal_calculate_apr',
    description: 'Estimate APR for a hypothetical position on a pool.',
    params: 'poolAddress, depositUsd',
  },
  {
    category: 'Positions',
    name: 'byreal_position_analyze',
    description: 'Analyze an existing CLMM position: performance, range health, pool context, unclaimed fees.',
    params: 'walletAddress, nftMint',
  },
  // ── Swap ───────────────────────────────────────────────────────────────────
  {
    category: 'Swap',
    name: 'byreal_swap_quote',
    description: 'Get a live swap quote (no wallet). Returns expected output, price impact, min received, pools used.',
    params: 'inputMint, outputMint, amount (raw units), slippageBps',
  },
  {
    category: 'Swap',
    name: 'byreal_swap_execute',
    description: 'Execute a swap on Byreal. Requires wallet configured. Signs and sends transaction.',
    params: 'inputMint, outputMint, amount (raw units), slippageBps',
  },
  {
    category: 'Swap',
    name: 'byreal_easy_swap',
    description: 'Human-friendly swap with dry-run support. Auto-resolves symbols, converts amounts. Includes error recovery suggestions.',
    params: 'fromToken (symbol or mint), toToken (symbol or mint), amount (e.g. "1.5"), slippageBps, dryRun (preview only)',
  },
  // ── Tokens ────────────────────────────────────────────────────────────────
  {
    category: 'Tokens',
    name: 'byreal_list_tokens',
    description: 'List known tokens on Byreal with prices.',
    params: 'page, pageSize, sortField, sortType',
  },
  {
    category: 'Tokens',
    name: 'byreal_token_info',
    description: 'Get info for a specific token by mint address.',
    params: 'mint',
  },
  // ── Market ────────────────────────────────────────────────────────────────
  {
    category: 'Market',
    name: 'byreal_market_overview',
    description: 'Get global Byreal market overview: total TVL, volume, top pools.',
    params: '(none)',
  },
  {
    category: 'Market',
    name: 'byreal_pool_klines',
    description: 'Get OHLCV kline (candlestick) data for a pool.',
    params: 'poolAddress, interval (1m/5m/15m/1h/4h/1d), limit',
  },
  {
    category: 'Market',
    name: 'byreal_dynamic_fee',
    description: 'Get current dynamic fee rates for Byreal pools.',
    params: '(none)',
  },
  // ── Liquidity ─────────────────────────────────────────────────────────────
  {
    category: 'Liquidity',
    name: 'byreal_open_position',
    description: 'Open a new CLMM LP position. Supports amountUsd for auto token split based on price range. Returns unsigned tx.',
    params: 'poolAddress, priceLower, priceUpper, baseToken, baseAmount OR amountUsd (auto-split), userAddress, slippage',
  },
  {
    category: 'Liquidity',
    name: 'byreal_close_position',
    description: 'Close a CLMM position (remove all liquidity). Returns unsigned tx.',
    params: 'nftMint, userAddress, slippage, closePosition',
  },
  {
    category: 'Liquidity',
    name: 'byreal_add_liquidity',
    description: 'Add liquidity to an existing position or create a new one. Requires wallet.',
    params: 'poolAddress, tokenAAmount, tokenBAmount, priceLower, priceUpper, slippageBps',
  },
  {
    category: 'Liquidity',
    name: 'byreal_remove_liquidity',
    description: 'Remove liquidity from a position (partial or full). Requires wallet.',
    params: 'nftMint, percent (0-100), slippageBps',
  },
  {
    category: 'Liquidity',
    name: 'byreal_collect_fees',
    description: 'Collect unclaimed fees from a position. Requires wallet.',
    params: 'nftMint',
  },
  // ── Copy Farmer ──────────────────────────────────────────────────────────
  {
    category: 'CopyFarmer',
    name: 'byreal_top_farmers',
    description: 'List top liquidity farmers on Byreal by earnings.',
    params: 'page, pageSize, poolAddress (optional)',
  },
  {
    category: 'CopyFarmer',
    name: 'byreal_top_positions',
    description: 'List top-performing positions in a pool for copy trading. Includes inRange status (whether earning fees). Use to discover copy targets.',
    params: 'poolAddress (required), page, pageSize, sortField (liquidity|apr|earned|pnl|copies|bonus|closeTime), sortType, status (0=open, 1=closed)',
  },
  {
    category: 'CopyFarmer',
    name: 'byreal_copy_position',
    description: 'Copy an existing position with same price range. Records referral on-chain for copy bonus. Supports amountUsd for auto token split.',
    params: 'positionAddress, userAddress, baseToken (A|B), baseAmount OR amountUsd (auto-split), slippage',
  },
  {
    category: 'CopyFarmer',
    name: 'byreal_copyfarmer_overview',
    description: 'Get CopyFarmer program global stats — total copies, followers, aggregate performance.',
    params: '(none)',
  },
  {
    category: 'CopyFarmer',
    name: 'byreal_farmer_positions',
    description: 'Get positions of a specific farmer by wallet address.',
    params: 'walletAddress, page, pageSize',
  },
  // ── Orders ────────────────────────────────────────────────────────────────
  {
    category: 'Orders',
    name: 'byreal_list_orders',
    description: 'List limit orders for a wallet.',
    params: 'walletAddress, page, pageSize',
  },
  {
    category: 'Orders',
    name: 'byreal_create_order',
    description: 'Create a limit order. Requires wallet.',
    params: 'inputMint, outputMint, inputAmount, outputAmount, expireAt',
  },
  {
    category: 'Orders',
    name: 'byreal_cancel_order',
    description: 'Cancel a limit order. Requires wallet.',
    params: 'orderId',
  },
  // ── Wallet ────────────────────────────────────────────────────────────────
  {
    category: 'Wallet',
    name: 'byreal_wallet_balance',
    description: 'Check SOL and token balances for a wallet.',
    params: 'walletAddress',
  },
  {
    category: 'Wallet',
    name: 'byreal_wallet_status',
    description: 'Check if a wallet keypair is configured in the MCP server.',
    params: '(none)',
  },
  // ── Catalog ───────────────────────────────────────────────────────────────
  {
    category: 'Discovery',
    name: 'byreal_catalog',
    description: 'List all available Byreal MCP tools with descriptions and parameters. Use for agent discovery.',
    params: 'search (optional keyword)',
  },
];

export function registerCatalogTools(server: McpServer, _chain: ChainClient) {
  server.tool(
    'byreal_catalog',
    'List all available Byreal MCP tools with descriptions and parameters. Use this for agent discovery and to understand what operations are possible.',
    {
      search: z.string().optional().describe('Optional keyword to filter tools (e.g. "swap", "pool", "position")'),
    },
    async ({ search }) => {
      let entries = TOOL_CATALOG;
      if (search) {
        const kw = search.toLowerCase();
        entries = TOOL_CATALOG.filter(t =>
          t.name.toLowerCase().includes(kw) ||
          t.description.toLowerCase().includes(kw) ||
          t.category.toLowerCase().includes(kw)
        );
      }

      const grouped: Record<string, ToolEntry[]> = {};
      for (const e of entries) {
        (grouped[e.category] ??= []).push(e);
      }

      const lines: string[] = [
        `🗂️  Byreal MCP Tool Catalog (${entries.length} tools${search ? ` matching "${search}"` : ''})`,
        '',
      ];

      for (const [cat, tools] of Object.entries(grouped)) {
        lines.push(`── ${cat} ──`);
        for (const t of tools) {
          lines.push(`  ${t.name}`);
          lines.push(`    ${t.description}`);
          lines.push(`    Params: ${t.params}`);
        }
        lines.push('');
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }
  );
}
