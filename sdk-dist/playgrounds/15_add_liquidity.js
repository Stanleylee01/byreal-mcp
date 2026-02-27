"use strict";
/**
 * Add liquidity to an existing position (user inputs the amount of TokenB, and calculates the amount of TokenA needed)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const decimal_js_1 = require("decimal.js");
const config_js_1 = require("./config.js");
async function main() {
    // step 1: Select the position to add liquidity
    // Change to your own NFT mint address
    const nftMint = new web3_js_1.PublicKey('CVqLrFi5n3HLzRJdGHdChtoXhycNeveShYkmGfeaXGHC');
    const positionInfo = await config_js_1.chain.getPositionInfoByNftMint(nftMint);
    if (!positionInfo) {
        console.error('Position does not exist');
        return;
    }
    console.log('========= step 1: Select the position =========');
    console.log('Position NFT address:', nftMint.toBase58());
    console.log(`Price range: ${positionInfo.uiPriceLower} - ${positionInfo.uiPriceUpper}`);
    console.log(`Current TokenA: ${positionInfo.tokenA.uiAmount}`);
    console.log(`Current TokenB: ${positionInfo.tokenB.uiAmount}`);
    // step 2: User inputs the amount of TokenB and the token type (TokenB as an example)
    const base = 'MintB';
    const baseAmount = new bn_js_1.default(1000000);
    // Get the pool information for calculation
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(positionInfo.rawPositionInfo.poolId);
    // Calculate the amount of TokenA needed
    const amountA = config_js_1.chain.getAmountAFromAmountB({
        priceLower: new decimal_js_1.Decimal(positionInfo.uiPriceLower),
        priceUpper: new decimal_js_1.Decimal(positionInfo.uiPriceUpper),
        amountB: baseAmount,
        poolInfo,
    });
    // Add a 2% slippage
    const amountAWithSlippage = new bn_js_1.default(amountA).mul(new bn_js_1.default(10000 * (1 + 0.02))).div(new bn_js_1.default(10000));
    console.log('========= step 2: User inputs the amount of TokenB and the token type =========');
    console.log('Amount of TokenB to be added =>', Number(baseAmount.toString()) / 10 ** positionInfo.tokenB.decimals);
    console.log('Estimated amount of TokenA needed =>', Number(amountA.toString()) / 10 ** positionInfo.tokenA.decimals);
    // Signer callback
    const signerCallback = async (tx) => {
        tx.sign([config_js_1.userKeypair]);
        return tx;
    };
    console.log('======= step 3: After confirming that there is no error, start adding liquidity =======');
    try {
        const txid = await config_js_1.chain.addLiquidity({
            userAddress: config_js_1.userAddress,
            nftMint,
            base,
            baseAmount,
            otherAmountMax: amountAWithSlippage,
            signerCallback,
        });
        console.log('Add liquidity successfully, txid:', txid);
    }
    catch (error) {
        console.error('Add liquidity failed:', error);
    }
}
main();
