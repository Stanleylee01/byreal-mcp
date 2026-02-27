"use strict";
/**
 * Create a position
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bn_js_1 = __importDefault(require("bn.js"));
const decimal_js_1 = require("decimal.js");
const index_js_1 = require("../index.js");
const config_js_1 = require("./config.js");
async function main() {
    // step 1: User selects the pool
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(config_js_1.PoolAddress.USDC_USDT);
    console.log('========= step 1: Select the pool =========');
    console.log('Selected pool address:', poolInfo.poolId.toBase58());
    // step 2: User inputs the price range
    const userStartPrice = '0.8';
    const userEndPrice = '0.9';
    // Calculate the accurate tick price, and show it to the user
    const priceInTickLower = index_js_1.TickMath.getTickAlignedPriceDetails(new decimal_js_1.Decimal(userStartPrice), poolInfo.tickSpacing, poolInfo.mintDecimalsA, poolInfo.mintDecimalsB);
    const priceInTickUpper = index_js_1.TickMath.getTickAlignedPriceDetails(new decimal_js_1.Decimal(userEndPrice), poolInfo.tickSpacing, poolInfo.mintDecimalsA, poolInfo.mintDecimalsB);
    console.log('========= step 2: User inputs the price range =========');
    console.log(`User input price range: ${userStartPrice} - ${userEndPrice}`);
    console.log(`Accurate price range: ${priceInTickLower.price.toNumber()} - ${priceInTickUpper.price.toNumber()}`);
    // step 3: User inputs the amount of TokenB and the token type
    const base = 'MintB';
    const baseAmount = new bn_js_1.default(2 * 10 ** poolInfo.mintDecimalsB);
    // Calculate the amount of TokenA needed
    const amountA = config_js_1.chain.getAmountAFromAmountB({
        priceLower: priceInTickLower.price,
        priceUpper: priceInTickUpper.price,
        amountB: baseAmount,
        poolInfo,
    });
    // Add a 2% slippage
    const amountAWithSlippage = new bn_js_1.default(amountA).mul(new bn_js_1.default(10000 * (1 + 0.02))).div(new bn_js_1.default(10000));
    console.log('========= step 3: User inputs the amount of TokenB and the token type =========');
    console.log('Amount of TokenB to be invested =>', Number(baseAmount.toString()) / 10 ** poolInfo.mintDecimalsB);
    console.log('Estimated amount of TokenA needed =>', Number(amountA.toString()) / 10 ** poolInfo.mintDecimalsA);
    // Signer callback, later this can be implemented with a wallet plugin
    const signerCallback = async (tx) => {
        tx.sign([config_js_1.userKeypair]);
        return tx;
    };
    console.log('======= step 4: After confirming that there is no error, start creating a position =======');
    const txid = await config_js_1.chain.createPosition({
        userAddress: config_js_1.userAddress,
        poolInfo,
        tickLower: priceInTickLower.tick,
        tickUpper: priceInTickUpper.tick,
        base,
        baseAmount,
        otherAmountMax: amountAWithSlippage,
        signerCallback,
    });
    console.log('Create position successfully, txid:', txid);
}
main();
