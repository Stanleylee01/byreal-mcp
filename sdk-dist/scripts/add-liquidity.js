/**
 * Build an UNSIGNED add-liquidity transaction.
 *
 * Input (env vars):
 *   NFT_MINT       - position NFT mint pubkey
 *   BASE_TOKEN     - "A" or "B"
 *   BASE_AMOUNT    - amount of base token in UI units (e.g. "10")
 *   USER_ADDRESS   - payer/user wallet pubkey
 *   SOL_ENDPOINT   - optional RPC endpoint
 *   SLIPPAGE       - optional slippage (default 0.02)
 *
 * Output (stdout): JSON matching byreal_add_liquidity tool expectations
 */
import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import { Chain } from '../client/index.js';
import { BYREAL_CLMM_PROGRAM_ID } from '../constants.js';
async function main() {
    const nftMint = process.env.NFT_MINT;
    const baseTokenEnv = process.env.BASE_TOKEN?.toUpperCase();
    const baseAmountUI = process.env.BASE_AMOUNT;
    const userAddress = process.env.USER_ADDRESS;
    const rpc = process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    const slippage = Number(process.env.SLIPPAGE ?? '0.02');
    if (!nftMint || !baseTokenEnv || !baseAmountUI || !userAddress) {
        throw new Error('Missing required env vars: NFT_MINT, BASE_TOKEN, BASE_AMOUNT, USER_ADDRESS');
    }
    if (baseTokenEnv !== 'A' && baseTokenEnv !== 'B') {
        throw new Error('BASE_TOKEN must be "A" or "B"');
    }
    const connection = new Connection(rpc);
    const chain = new Chain({ connection, programId: BYREAL_CLMM_PROGRAM_ID });
    const userPubkey = new PublicKey(userAddress);
    const nftPubkey = new PublicKey(nftMint);
    const posInfo = await chain.getPositionInfoByNftMint(nftPubkey);
    if (!posInfo)
        throw new Error('Position not found: ' + nftMint);
    const poolInfo = await chain.getRawPoolInfoByPoolId(posInfo.rawPositionInfo.poolId);
    const base = baseTokenEnv === 'A' ? 'MintA' : 'MintB';
    const baseDec = baseTokenEnv === 'A' ? posInfo.tokenA.decimals : posInfo.tokenB.decimals;
    const baseAmountRaw = new BN(Math.floor(Number(baseAmountUI) * 10 ** baseDec));
    // Calculate other amount from position price range
    let otherAmountRaw;
    let estAmtA;
    let estAmtB;
    if (base === 'MintA') {
        const amtB = chain.getAmountBFromAmountA({
            priceLower: new Decimal(posInfo.uiPriceLower),
            priceUpper: new Decimal(posInfo.uiPriceUpper),
            amountA: baseAmountRaw,
            poolInfo,
        });
        otherAmountRaw = new BN(amtB).mul(new BN(Math.round(10000 * (1 + slippage)))).div(new BN(10000));
        estAmtA = baseAmountUI;
        estAmtB = (Number(amtB.toString()) / 10 ** posInfo.tokenB.decimals).toFixed(6);
    }
    else {
        const amtA = chain.getAmountAFromAmountB({
            priceLower: new Decimal(posInfo.uiPriceLower),
            priceUpper: new Decimal(posInfo.uiPriceUpper),
            amountB: baseAmountRaw,
            poolInfo,
        });
        otherAmountRaw = new BN(amtA).mul(new BN(Math.round(10000 * (1 + slippage)))).div(new BN(10000));
        estAmtA = (Number(amtA.toString()) / 10 ** posInfo.tokenA.decimals).toFixed(6);
        estAmtB = baseAmountUI;
    }
    const result = await chain.addLiquidityInstructions({
        userAddress: userPubkey,
        nftMint: nftPubkey,
        base,
        baseAmount: baseAmountRaw,
        otherAmountMax: otherAmountRaw,
    });
    const serialized = result.transaction.serialize();
    const unsignedTx = Buffer.from(serialized).toString('base64');
    process.stdout.write(JSON.stringify({
        unsignedTx,
        positionInfo: {
            nftMint,
            poolAddress: posInfo.rawPositionInfo.poolId.toBase58(),
            priceLower: posInfo.uiPriceLower,
            priceUpper: posInfo.uiPriceUpper,
            currentAmountA: posInfo.tokenA.uiAmount,
            currentAmountB: posInfo.tokenB.uiAmount,
        },
        estimatedAmountA: estAmtA,
        estimatedAmountB: estAmtB,
    }) + '\n');
}
main().catch((e) => {
    process.stderr.write('[add-liquidity] Error: ' + e.message + '\n');
    process.exit(1);
});
