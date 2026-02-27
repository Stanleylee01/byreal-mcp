/**
 * Build an UNSIGNED create-position transaction.
 *
 * Input (env vars) — choose prices OR ticks:
 *   POOL_ADDRESS   - pool pubkey
 *   PRICE_LOWER    - lower price (token B per token A) — OR use TICK_LOWER
 *   PRICE_UPPER    - upper price                       — OR use TICK_UPPER
 *   TICK_LOWER     - lower tick index (overrides PRICE_LOWER if set)
 *   TICK_UPPER     - upper tick index (overrides PRICE_UPPER if set)
 *   BASE_TOKEN     - "A" or "B"
 *   BASE_AMOUNT    - amount of base token in UI units (e.g. "1.5")
 *   USER_ADDRESS   - payer/user wallet pubkey
 *   SOL_ENDPOINT   - optional RPC endpoint
 *   SLIPPAGE       - optional slippage (default 0.02)
 *
 * Output (stdout): JSON matching byreal_open_position tool expectations
 */
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import { Chain } from '../client/index.js';
import { TickMath } from '../index.js';
import { BYREAL_CLMM_PROGRAM_ID } from '../constants.js';
import { makeTransaction } from '../utils/index.js';
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
async function main() {
    const poolAddress = process.env.POOL_ADDRESS;
    const priceLowerIn = process.env.PRICE_LOWER;
    const priceUpperIn = process.env.PRICE_UPPER;
    const tickLowerIn = process.env.TICK_LOWER;
    const tickUpperIn = process.env.TICK_UPPER;
    const baseTokenEnv = process.env.BASE_TOKEN?.toUpperCase();
    const baseAmountUI = process.env.BASE_AMOUNT;
    const userAddress = process.env.USER_ADDRESS;
    const rpc = process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    const slippage = Number(process.env.SLIPPAGE ?? '0.02');
    const hasPrices = priceLowerIn && priceUpperIn;
    const hasTicks = tickLowerIn !== undefined && tickUpperIn !== undefined;
    if (!poolAddress || (!hasPrices && !hasTicks) || !baseTokenEnv || !baseAmountUI || !userAddress) {
        throw new Error('Missing required env vars: POOL_ADDRESS, (PRICE_LOWER+PRICE_UPPER or TICK_LOWER+TICK_UPPER), BASE_TOKEN, BASE_AMOUNT, USER_ADDRESS');
    }
    if (baseTokenEnv !== 'A' && baseTokenEnv !== 'B') {
        throw new Error('BASE_TOKEN must be "A" or "B"');
    }
    const connection = new Connection(rpc);
    const chain = new Chain({ connection, programId: BYREAL_CLMM_PROGRAM_ID });
    const userPubkey = new PublicKey(userAddress);
    const poolPubkey = new PublicKey(poolAddress);
    const poolInfo = await chain.getRawPoolInfoByPoolId(poolPubkey);
    const decA = poolInfo.mintDecimalsA;
    const decB = poolInfo.mintDecimalsB;
    const mintAStr = poolInfo.mintA.toBase58();
    const mintBStr = poolInfo.mintB.toBase58();
    // Resolve tick + price from input
    let tickLower;
    let tickUpper;
    let priceLowerDisplay;
    let priceUpperDisplay;
    if (hasTicks) {
        tickLower = Number(tickLowerIn);
        tickUpper = Number(tickUpperIn);
        priceLowerDisplay = TickMath.getPriceFromTick({ tick: tickLower, decimalsA: decA, decimalsB: decB });
        priceUpperDisplay = TickMath.getPriceFromTick({ tick: tickUpper, decimalsA: decA, decimalsB: decB });
    }
    else {
        // Align price ticks from price input
        const tickLowerInfo = TickMath.getTickAlignedPriceDetails(new Decimal(priceLowerIn), poolInfo.tickSpacing, decA, decB);
        const tickUpperInfo = TickMath.getTickAlignedPriceDetails(new Decimal(priceUpperIn), poolInfo.tickSpacing, decA, decB);
        tickLower = tickLowerInfo.tick;
        tickUpper = tickUpperInfo.tick;
        priceLowerDisplay = tickLowerInfo.price;
        priceUpperDisplay = tickUpperInfo.price;
    }
    const base = baseTokenEnv === 'A' ? 'MintA' : 'MintB';
    const baseDec = baseTokenEnv === 'A' ? decA : decB;
    const baseAmountRaw = new BN(Math.floor(Number(baseAmountUI) * 10 ** baseDec));
    // Estimate other token amount
    let otherAmountRaw;
    let estAmtA;
    let estAmtB;
    if (base === 'MintA') {
        const amtB = chain.getAmountBFromAmountA({
            priceLower: priceLowerDisplay,
            priceUpper: priceUpperDisplay,
            amountA: baseAmountRaw,
            poolInfo,
        });
        otherAmountRaw = new BN(amtB).mul(new BN(Math.round(10000 * (1 + slippage)))).div(new BN(10000));
        estAmtA = Number(baseAmountUI);
        estAmtB = Number(amtB.toString()) / 10 ** decB;
    }
    else {
        const amtA = chain.getAmountAFromAmountB({
            priceLower: priceLowerDisplay,
            priceUpper: priceUpperDisplay,
            amountB: baseAmountRaw,
            poolInfo,
        });
        otherAmountRaw = new BN(amtA).mul(new BN(Math.round(10000 * (1 + slippage)))).div(new BN(10000));
        estAmtA = Number(amtA.toString()) / 10 ** decA;
        estAmtB = Number(baseAmountUI);
    }
    // Build unsigned transaction
    const result = await chain.createPositionInstructions({
        userAddress: userPubkey,
        poolInfo,
        tickLower,
        tickUpper,
        base,
        baseAmount: baseAmountRaw,
        otherAmountMax: otherAmountRaw,
    });
    // If REFERER_POSITION is set (Copy Farm), add Memo instruction
    const refererPosition = process.env.REFERER_POSITION;
    const allInstructions = [...result.instructions];
    if (refererPosition) {
        const memoIx = new TransactionInstruction({
            programId: MEMO_PROGRAM_ID,
            keys: [{ pubkey: userPubkey, isSigner: true, isWritable: false }],
            data: Buffer.from(`referer_position=${refererPosition}`),
        });
        allInstructions.push(memoIx);
    }
    // Always rebuild with sufficient compute budget (open position + ATA creation needs ~300k CU)
    const tx = await makeTransaction({
        connection,
        payerPublicKey: userPubkey,
        instructions: allInstructions,
        signers: result.signers,
        options: { computeUnitLimit: 300_000 },
    });
    const unsignedTx = Buffer.from(tx.serialize()).toString('base64');
    process.stdout.write(JSON.stringify({
        unsignedTx,
        poolAddress,
        mintA: mintAStr,
        mintB: mintBStr,
        priceLower: priceLowerDisplay.toFixed(8),
        priceUpper: priceUpperDisplay.toFixed(8),
        tickLower,
        tickUpper,
        nftAddress: result.nftAddress,
        estimatedAmountA: estAmtA,
        estimatedAmountB: estAmtB,
    }) + '\n');
}
main().catch((e) => {
    process.stderr.write('[create-position] Error: ' + e.message + '\n');
    process.exit(1);
});
