/**
 * Byreal MCP 全量测试脚本
 * 测试钱包: 8r9bADv7UJ7mXgWZXWjZ6R4Ez1Kwdub1AEr3q21sQtVW
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// MCP server process setup
import { spawn } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';

const WALLET = '8r9bADv7UJ7mXgWZXWjZ6R4Ez1Kwdub1AEr3q21sQtVW';

interface MCPResult {
  tool: string;
  params: any;
  success: boolean;
  result?: any;
  error?: string;
  durationMs: number;
}

const results: MCPResult[] = [];

// MCP client that communicates via stdio
class MCPClient {
  private process: any;
  private pending = new Map<string, { resolve: Function; reject: Function }>();
  private msgId = 0;
  private buffer = '';

  constructor() {
    this.process = spawn('node', ['dist/index.js'], {
      cwd: '/tmp/byreal-mcp-test',
      env: {
        ...process.env,
        SOLANA_PRIVATE_KEY: '5bu9hnXL6wkUUCgfGrERhqe3rdDWocJbvVD2gMzTyAYuhE3JbSnvRfZQKfaToUESm5hrYezd9typb6ak5x786e3z',
        SOL_RPC: 'https://mainnet.helius-rpc.com/?api-key=0560c29c-ff5e-4891-845f-a032788039f7',
      }
    });

    this.process.stdout.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) {
          try {
            const msg = JSON.parse(line);
            if (msg.id && this.pending.has(msg.id.toString())) {
              const { resolve, reject } = this.pending.get(msg.id.toString())!;
              this.pending.delete(msg.id.toString());
              if (msg.error) reject(new Error(JSON.stringify(msg.error)));
              else resolve(msg.result);
            }
          } catch {}
        }
      }
    });

    this.process.stderr.on('data', (data: Buffer) => {
      // Ignore MCP init logs
    });
  }

  async initialize() {
    await this.send('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'test-client', version: '1.0' },
      capabilities: {}
    });
  }

  send(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.pending.set(id.toString(), { resolve, reject });
      const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
      this.process.stdin.write(msg);
      setTimeout(() => {
        if (this.pending.has(id.toString())) {
          this.pending.delete(id.toString());
          reject(new Error('Timeout after 15s'));
        }
      }, 15000);
    });
  }

  async callTool(name: string, args: any): Promise<any> {
    return this.send('tools/call', { name, arguments: args });
  }

  kill() {
    this.process.kill();
  }
}

async function test(client: MCPClient, toolName: string, params: any, label?: string): Promise<void> {
  const displayName = label || toolName;
  const start = Date.now();
  try {
    process.stdout.write(`Testing ${displayName}... `);
    const result = await client.callTool(toolName, params);
    const duration = Date.now() - start;
    
    // Parse content
    let content: any;
    if (result?.content?.[0]?.text) {
      try { content = JSON.parse(result.content[0].text); } 
      catch { content = result.content[0].text; }
    } else {
      content = result;
    }
    
    results.push({ tool: displayName, params, success: true, result: content, durationMs: duration });
    console.log(`✅ ${duration}ms`);
  } catch (e: any) {
    const duration = Date.now() - start;
    results.push({ tool: displayName, params, success: false, error: e.message, durationMs: duration });
    console.log(`❌ ${e.message.slice(0, 100)}`);
  }
}

async function main() {
  console.log('=== Byreal MCP Full Test Suite ===\n');
  
  const client = new MCPClient();
  
  // Wait for server to start
  await new Promise(r => setTimeout(r, 2000));
  await client.initialize();
  console.log('MCP initialized\n');

  // List tools
  try {
    const tools = await client.send('tools/list');
    console.log(`Available tools (${tools.tools?.length || 0}):`);
    for (const t of (tools.tools || [])) {
      console.log(`  - ${t.name}`);
    }
    console.log('');
  } catch (e: any) {
    console.log('Failed to list tools:', e.message);
  }

  // ===== MARKET DATA =====
  console.log('--- Market Data Tests ---');
  await test(client, 'byreal_hot_tokens', {}, 'hot_tokens (no params)');
  await test(client, 'byreal_hot_tokens', { type: 'new' }, 'hot_tokens (type=new)');
  await test(client, 'byreal_hot_tokens', { type: 'trending' }, 'hot_tokens (type=trending)');
  
  await test(client, 'byreal_mint_prices', { 
    mints: ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'] 
  }, 'mint_prices (USDC)');
  await test(client, 'byreal_mint_prices', { 
    mints: ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'So11111111111111111111111111111111111111112']
  }, 'mint_prices (USDC + SOL)');
  
  await test(client, 'byreal_pool_search', { query: 'SOL' }, 'pool_search (SOL)');
  await test(client, 'byreal_pool_search', { query: 'USDC' }, 'pool_search (USDC)');

  // Get pool address from search results for further tests
  const searchResult = results.find(r => r.tool === 'pool_search (SOL)');
  let poolAddress = '';
  if (searchResult?.success && searchResult.result?.pools?.length > 0) {
    poolAddress = searchResult.result.pools[0].address || searchResult.result.pools[0].poolAddress || '';
    console.log(`Using pool: ${poolAddress}`);
  } else if (searchResult?.success && Array.isArray(searchResult.result)) {
    poolAddress = searchResult.result[0]?.address || searchResult.result[0]?.poolAddress || '';
    console.log(`Using pool: ${poolAddress}`);
  }

  if (poolAddress) {
    await test(client, 'byreal_pool_details', { poolAddress }, 'pool_details');
    await test(client, 'byreal_kline', { poolAddress, interval: 60 }, 'kline (60min)');
    await test(client, 'byreal_kline', { poolAddress, interval: '60' }, 'kline (interval as string)');
    await test(client, 'byreal_calculate_apr', { poolAddress }, 'calculate_apr');
  } else {
    console.log('⚠️  No pool found from search, skipping pool_details/kline/calculate_apr');
  }

  // ===== WALLET / POSITIONS =====
  console.log('\n--- Wallet & Position Tests ---');
  await test(client, 'byreal_wallet_balance', { walletAddress: WALLET }, 'wallet_balance');
  await test(client, 'byreal_list_positions', { walletAddress: WALLET }, 'list_positions (open)');
  await test(client, 'byreal_list_positions', { walletAddress: WALLET, status: 0 }, 'list_positions (status=0)');
  await test(client, 'byreal_list_positions', { walletAddress: WALLET, status: 2 }, 'list_positions (status=2 closed)');
  await test(client, 'byreal_position_overview', { walletAddress: WALLET }, 'position_overview');

  // ===== ORDERS =====
  console.log('\n--- Order Tests ---');
  await test(client, 'byreal_order_history', { walletAddress: WALLET }, 'order_history');
  await test(client, 'byreal_order_history', { walletAddress: WALLET, page: 1, pageSize: 10 }, 'order_history (paginated)');

  // ===== SWAP =====
  console.log('\n--- Swap Tests ---');
  const SOL_MINT = 'So11111111111111111111111111111111111111112';
  const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  
  await test(client, 'byreal_swap_quote', {
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: 0.01
  }, 'swap_quote (SOL→USDC)');
  
  await test(client, 'byreal_swap', {
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: 0.01,
    dryRun: true
  }, 'swap dryRun (SOL→USDC)');

  client.kill();

  // ===== REPORT =====
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n=== Test Results: ${passed}✅ ${failed}❌ ===\n`);
  
  let report = `# Byreal MCP Test Report\n`;
  report += `Date: ${new Date().toISOString()}\n`;
  report += `Version: 0.6.3\n`;
  report += `Wallet: ${WALLET}\n\n`;
  report += `## Summary\n`;
  report += `- Passed: ${passed}\n- Failed: ${failed}\n\n`;
  report += `## Detailed Results\n\n`;
  report += `| Tool | Status | Duration | Notes |\n`;
  report += `|------|--------|----------|-------|\n`;
  
  for (const r of results) {
    const status = r.success ? '✅' : '❌';
    const note = r.success 
      ? (typeof r.result === 'object' ? JSON.stringify(r.result).slice(0, 80) : String(r.result).slice(0, 80))
      : r.error?.slice(0, 100) || '';
    report += `| ${r.tool} | ${status} | ${r.durationMs}ms | ${note} |\n`;
  }
  
  report += `\n## Failed Tests Detail\n\n`;
  for (const r of results.filter(r => !r.success)) {
    report += `### ${r.tool}\n`;
    report += `**Error:** ${r.error}\n`;
    report += `**Params:** ${JSON.stringify(r.params)}\n\n`;
  }
  
  report += `\n## Successful Responses Sample\n\n`;
  for (const r of results.filter(r => r.success).slice(0, 3)) {
    report += `### ${r.tool}\n`;
    report += '```json\n' + JSON.stringify(r.result, null, 2).slice(0, 500) + '\n```\n\n';
  }
  
  const fs = await import('fs');
  fs.writeFileSync('/tmp/byreal-mcp-test/TEST_REPORT.md', report);
  console.log('Report written to TEST_REPORT.md');
  
  // Also save raw results JSON
  fs.writeFileSync('/tmp/byreal-mcp-test/test-results.json', JSON.stringify(results, null, 2));
}

main().catch(console.error);
