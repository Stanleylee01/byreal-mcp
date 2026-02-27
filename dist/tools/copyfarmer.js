/**
 * CopyFarmer tools — top farmers leaderboard, top positions leaderboard, overview
 *
 * Copy Farm write operation is in liquidity.ts (byreal_copy_position)
 * which uses the correct TICK mode + REFERER_POSITION memo.
 */
import { z } from 'zod';
import { apiPost, apiFetch } from '../config.js';
const API_BASE = process.env.BYREAL_API_BASE || 'https://api2.byreal.io/byreal/api';
export function registerCopyfarmerTools(server, chain) {
    server.tool('byreal_top_farmers', 'List top LP farmers on Byreal sorted by PnL. Shows PnL, liquidity, fees, copies, and avg APR per farmer.', {
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(20).default(5),
        poolAddress: z.string().optional().describe('Filter by pool address (base58)'),
    }, async ({ page, pageSize, poolAddress }) => {
        const body = { page, pageSize, sortType: 'desc' };
        if (poolAddress)
            body.poolAddress = poolAddress;
        const data = await apiPost(`${API_BASE}/dex/v2/copyfarmer/top-farmers`, body);
        if (!data?.records?.length) {
            return { content: [{ type: 'text', text: 'No farmers found.' }] };
        }
        const lines = data.records.map((f, i) => {
            const pool = data.poolMap?.[f.poolAddress];
            const pair = pool
                ? `${pool.mintA?.symbol ?? '?'}/${pool.mintB?.symbol ?? '?'}`
                : (f.poolAddress ? f.poolAddress.slice(0, 8) + '...' : 'All Pools');
            return [
                `#${(page - 1) * pageSize + i + 1} ${pair}`,
                `  Farmer: ${f.providerAddress}`,
                `  PnL: $${Number(f.totalPnl ?? 0).toFixed(2)}`,
                `  Liquidity: $${Number(f.liquidity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                `  Fees: $${Number(f.totalFee ?? 0).toFixed(2)}`,
                `  Bonus: $${Number(f.totalBonus ?? 0).toFixed(2)}`,
                `  Avg APR: ${f.avgApr ? (Number(f.avgApr) * 100).toFixed(2) + '%' : 'N/A'}`,
                `  Positions: ${f.openPositionCount ?? 0} open, ${f.closePositonCount ?? 0} closed`,
                `  Copies: ${f.copies ?? 0} | Follows: ${f.follows ?? 0}`,
                `  Avg Age: ${f.avgAge ? (Number(f.avgAge) / 86400000).toFixed(1) + 'd' : 'N/A'}`,
            ].join('\n');
        });
        return {
            content: [{
                    type: 'text',
                    text: `🏆 Top Farmers (${data.total} total):\n\n${lines.join('\n\n')}`,
                }],
        };
    });
    server.tool('byreal_top_positions', 'List top-performing LP positions on Byreal sorted by PnL. Shows deposit, fees, bonus, copies, and age.', {
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(20).default(5),
        poolAddress: z.string().optional().describe('Filter by pool address (base58)'),
        incentiveOnly: z.boolean().optional().describe('Only show incentivized positions'),
    }, async ({ page, pageSize, poolAddress, incentiveOnly }) => {
        const body = { page, pageSize, sortType: 'desc' };
        if (poolAddress)
            body.poolAddress = poolAddress;
        if (incentiveOnly !== undefined)
            body.incentiveOnly = incentiveOnly;
        const data = await apiPost(`${API_BASE}/dex/v2/copyfarmer/top-positions`, body);
        if (!data?.records?.length) {
            return { content: [{ type: 'text', text: 'No positions found.' }] };
        }
        const lines = data.records.map((p, i) => {
            const pool = data.poolMap?.[p.poolAddress];
            const pair = pool
                ? `${pool.mintA?.symbol ?? '?'}/${pool.mintB?.symbol ?? '?'}`
                : p.poolAddress?.slice(0, 8) + '...';
            const ageDays = p.positionAgeMs ? (Number(p.positionAgeMs) / 86400000).toFixed(1) : '?';
            return [
                `#${(page - 1) * pageSize + i + 1} ${pair}`,
                `  Position: ${p.positionAddress}`,
                `  Wallet: ${p.walletAddress}`,
                `  Deposit: $${Number(p.totalDeposit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                `  Liquidity: $${Number(p.liquidityUsd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                `  PnL: $${Number(p.pnlUsd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} (${(Number(p.pnlUsdPercent ?? 0) * 100).toFixed(2)}%)`,
                `  Fees: $${Number(p.earnedUsd ?? 0).toFixed(2)}`,
                `  Bonus: $${Number(p.bonusUsd ?? 0).toFixed(2)}`,
                `  Copies: ${p.copies ?? 0}`,
                `  Age: ${ageDays}d`,
                `  Status: ${p.status === 0 ? '🟢 Active' : '🔴 Closed'}`,
            ].join('\n');
        });
        return {
            content: [{
                    type: 'text',
                    text: `🏆 Top Positions (${data.total} total):\n\n${lines.join('\n\n')}`,
                }],
        };
    });
    server.tool('byreal_copyfarmer_overview', 'Get CopyFarmer program global stats — total copies, followers, and aggregate performance.', {}, async () => {
        const data = await apiFetch(`${API_BASE}/dex/v2/copyfarmer/overview`);
        if (!data)
            return { content: [{ type: 'text', text: 'No data.' }] };
        const lines = Object.entries(data).map(([k, v]) => `${k}: ${v}`);
        return {
            content: [{ type: 'text', text: `CopyFarmer Overview:\n${lines.join('\n')}` }],
        };
    });
}
//# sourceMappingURL=copyfarmer.js.map