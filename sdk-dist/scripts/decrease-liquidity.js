/**
 * Build an UNSIGNED decrease-liquidity transaction (partial withdrawal).
 *
 * Input (env vars):
 *   NFT_MINT           - position NFT mint pubkey
 *   LIQUIDITY_PERCENT  - percentage to remove (1-100)
 *   USER_ADDRESS       - payer/user wallet pubkey
 *   SOL_ENDPOINT       - optional RPC endpoint
 *   SLIPPAGE           - optional slippage (default 0.02)
 *
 * Output (stdout): JSON matching byreal_remove_liquidity tool expectations
 */
import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Chain } from '../client/index.js';
import { BYREAL_CLMM_PROGRAM_ID } from '../constants.js';
import { PositionUtils } from '../instructions/index.js';
async function main() {
    const nftMint = process.env.NFT_MINT;
    const pctStr = process.env.LIQUIDITY_PERCENT;
    const userAddress = process.env.USER_ADDRESS;
    const rpc = process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    const slippage = Number(process.env.SLIPPAGE ?? '0.02');
    if (!nftMint || !pctStr || !userAddress) {
        throw new Error('Missing required env vars: NFT_MINT, LIQUIDITY_PERCENT, USER_ADDRESS');
    }
    const pct = Number(pctStr);
    if (pct <= 0 || pct > 100)
        throw new Error('LIQUIDITY_PERCENT must be between 1 and 100');
    const connection = new Connection(rpc);
    const chain = new Chain({ connection, programId: BYREAL_CLMM_PROGRAM_ID });
    const userPubkey = new PublicKey(userAddress);
    const nftPubkey = new PublicKey(nftMint);
    // Get position info (rich version for display, raw for calculation)
    const posInfo = await chain.getPositionInfoByNftMint(nftPubkey);
    if (!posInfo)
        throw new Error('Position not found: ' + nftMint);
    const rawPos = posInfo.rawPositionInfo;
    const poolInfo = await chain.getRawPoolInfoByPoolId(rawPos.poolId);
    // Calculate liquidity to remove
    const totalLiquidity = rawPos.liquidity;
    const liquidityToRemove = pct >= 100
        ? totalLiquidity
        : totalLiquidity.mul(new BN(Math.round(pct * 100))).div(new BN(10000));
    // Estimate tokens out
    const epochInfo = await connection.getEpochInfo();
    const { amountSlippageA, amountSlippageB } = PositionUtils.getAmountsFromLiquidity({
        poolInfo,
        ownerPosition: rawPos,
        liquidity: liquidityToRemove,
        slippage,
        add: false,
        epochInfo,
    });
    const decA = poolInfo.mintDecimalsA;
    const decB = poolInfo.mintDecimalsB;
    const result = await chain.decreaseLiquidityInstructions({
        userAddress: userPubkey,
        nftMint: nftPubkey,
        liquidity: liquidityToRemove,
        slippage,
    });
    const serialized = result.transaction.serialize();
    const unsignedTx = Buffer.from(serialized).toString('base64');
    process.stdout.write(JSON.stringify({
        unsignedTx,
        positionInfo: {
            nftMint,
            poolAddress: rawPos.poolId.toBase58(),
            priceLower: posInfo.uiPriceLower,
            priceUpper: posInfo.uiPriceUpper,
            currentAmountA: posInfo.tokenA.uiAmount,
            currentAmountB: posInfo.tokenB.uiAmount,
        },
        liquidityPercent: pct,
        expectedAmountA: (Number(amountSlippageA.amount.toString()) / 10 ** decA).toFixed(6),
        expectedAmountB: (Number(amountSlippageB.amount.toString()) / 10 ** decB).toFixed(6),
        liquidityToRemove: liquidityToRemove.toString(),
        totalLiquidity: totalLiquidity.toString(),
    }) + '\n');
}
main().catch((e) => {
    process.stderr.write('[decrease-liquidity] Error: ' + e.message + '\n');
    process.exit(1);
});
