"use strict";
/**
 * Decrease liquidity proportionally
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const config_js_1 = require("./config.js");
async function main() {
    // Change to your own NFT mint address
    const nftMint = new web3_js_1.PublicKey('3eunC8kdMEwBRQHd91cyQ36FVQFXDuicGk7xuVS6hFfk');
    const positionInfo = await config_js_1.chain.getRawPositionInfoByNftMint(nftMint);
    if (!positionInfo) {
        throw new Error('Position not found');
    }
    const { liquidity } = positionInfo;
    const decreasePercentage = 50; // Decrease 50% of the liquidity
    const liquidityToDecrease = liquidity.mul(new bn_js_1.default(decreasePercentage)).div(new bn_js_1.default(100));
    console.log('Current liquidity amount:', liquidity.toString());
    console.log('Liquidity to decrease:', liquidityToDecrease.toString());
    const txid = await config_js_1.chain.decreaseLiquidity({
        userAddress: config_js_1.userAddress,
        nftMint,
        // Decrease half of the liquidity
        liquidity: liquidityToDecrease,
        signerCallback: config_js_1.signerCallback,
    });
    console.log('Decrease liquidity successfully, txid:', txid);
}
main();
