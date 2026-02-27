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
    // Specify the desired output amount: 1 USDT
    const amountOut = new bn_js_1.default(1 * 10 ** poolInfo.mintDecimalsB);
    console.log('amountOut ==>', amountOut.toString());
    // step 1: Get exact output quote information
    const quoteReturn = await config_js_1.chain.quoteSwapExactOut({
        poolInfo,
        slippage: 0.01, // 1% slippage
        outputTokenMint: poolInfo.mintB, // Output USDT (tokenB)
        amountOut,
    });
    console.log('quoteReturn', {
        allTrade: quoteReturn.allTrade,
        expectedAmountIn: quoteReturn.expectedAmountIn.toString(),
        maxAmountIn: quoteReturn.maxAmountIn.toString(),
        amountOut: quoteReturn.amountOut.toString(),
        isOutputMintA: quoteReturn.isOutputMintA,
        remainingAccounts: quoteReturn.remainingAccounts.map((account) => account.toBase58()),
        executionPrice: quoteReturn.executionPrice.toString(),
        feeAmount: quoteReturn.feeAmount.toString(),
    });
    // step 2: Execute exact output transaction
    const txid = await config_js_1.chain.swapExactOut({
        poolInfo,
        quoteReturn,
        userAddress: config_js_1.userAddress,
        signerCallback: config_js_1.signerCallback,
    });
    console.log('txid', txid);
}
main();
