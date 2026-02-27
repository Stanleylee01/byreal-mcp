/**
 * Build an UNSIGNED close-position transaction (remove all liquidity + optionally close NFT).
 *
 * Input (env vars):
 *   NFT_MINT        - position NFT mint pubkey
 *   USER_ADDRESS    - payer/user wallet pubkey
 *   SOL_ENDPOINT    - optional RPC endpoint
 *   SLIPPAGE        - optional slippage (default 0.02)
 *   CLOSE_POSITION  - "false" to keep NFT open (default "true")
 *
 * Output (stdout): JSON matching byreal_close_position tool expectations
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { Chain } from '../client/index.js';
import { BYREAL_CLMM_PROGRAM_ID } from '../constants.js';
async function main() {
    const nftMint = process.env.NFT_MINT;
    const userAddress = process.env.USER_ADDRESS;
    const rpc = process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    const slippage = Number(process.env.SLIPPAGE ?? '0.02');
    const closePosEnv = process.env.CLOSE_POSITION;
    const closePos = closePosEnv !== 'false';
    if (!nftMint || !userAddress) {
        throw new Error('Missing required env vars: NFT_MINT, USER_ADDRESS');
    }
    const connection = new Connection(rpc);
    const chain = new Chain({ connection, programId: BYREAL_CLMM_PROGRAM_ID });
    const userPubkey = new PublicKey(userAddress);
    const nftPubkey = new PublicKey(nftMint);
    // Get rich position info for display
    const positionInfo = await chain.getPositionInfoByNftMint(nftPubkey);
    if (!positionInfo)
        throw new Error('Position not found: ' + nftMint);
    const rawPos = positionInfo.rawPositionInfo;
    const poolId = rawPos.poolId.toBase58();
    const mintA = positionInfo.tokenA.address.toBase58();
    const mintB = positionInfo.tokenB.address.toBase58();
    // Build unsigned transaction
    const result = await chain.decreaseFullLiquidityInstructions({
        userAddress: userPubkey,
        nftMint: nftPubkey,
        closePosition: closePos,
        slippage,
    });
    const serialized = result.transaction.serialize();
    const unsignedTx = Buffer.from(serialized).toString('base64');
    process.stdout.write(JSON.stringify({
        unsignedTx,
        positionInfo: {
            nftMint,
            poolAddress: poolId,
            mintA,
            mintB,
            priceLower: positionInfo.uiPriceLower,
            priceUpper: positionInfo.uiPriceUpper,
            amountA: positionInfo.tokenA.uiAmount,
            amountB: positionInfo.tokenB.uiAmount,
            feeAmountA: positionInfo.tokenA.uiFeeAmount,
            feeAmountB: positionInfo.tokenB.uiFeeAmount,
            closePosition: closePos,
        },
    }) + '\n');
}
main().catch((e) => {
    process.stderr.write('[close-position] Error: ' + e.message + '\n');
    process.exit(1);
});
