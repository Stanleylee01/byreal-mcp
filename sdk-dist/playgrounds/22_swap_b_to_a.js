"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bn_js_1 = __importDefault(require("bn.js"));
const config_js_1 = require("./config.js");
async function main() {
    console.log('userAddress ==>', config_js_1.userAddress.toBase58());
    const poolInfo = await config_js_1.chain.getRawPoolInfoByPoolId(config_js_1.PoolAddress.USDC_USDT);
    const amountIn = new bn_js_1.default(1 * 10 ** poolInfo.mintDecimalsB);
    console.log('amountIn ==>', amountIn.toString());
    // step 1: Get quote trading information
    const quoteReturn = await config_js_1.chain.qouteSwap({
        poolInfo,
        slippage: 0.01,
        inputTokenMint: poolInfo.mintB,
        amountIn,
    });
    console.log('quoteReturn', {
        allTrade: quoteReturn.allTrade,
        minAmountOut: quoteReturn.minAmountOut.toString(),
        expectedAmountOut: quoteReturn.expectedAmountOut.toString(),
        amountIn: quoteReturn.amountIn.toString(),
        isInputMintA: quoteReturn.isInputMintA,
        remainingAccounts: quoteReturn.remainingAccounts.map((account) => account.toBase58()),
        executionPrice: quoteReturn.executionPrice.toString(),
        feeAmount: quoteReturn.feeAmount.toString(),
    });
    // step 2: Execute transaction
    const txid = await config_js_1.chain.swap({
        poolInfo,
        quoteReturn,
        userAddress: config_js_1.userAddress,
        signerCallback: config_js_1.signerCallback,
    });
    console.log('txid', txid);
}
main();
