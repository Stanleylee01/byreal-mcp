"use strict";
/**
 * Collect fees from all positions of the specified user
 */
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const index_js_1 = require("../index.js");
const config_js_1 = require("./config.js");
async function main() {
    // Get the list of positions under the specified account
    // const positionList = await chain.getRawPositionInfoListByUserAddress(userAddress);
    // const nftMintList = positionList.map((position) => position.nftMint);
    const nftMintList = [
        new web3_js_1.PublicKey('C4y5bhKwD7ai9iJ5h5XP1ct4GQPusS4MsV4mYaSKuxAu'),
        new web3_js_1.PublicKey('FSNhhUH1qxDk5ZHbGCcsRJzqaFGqvjE46DP2Z8RsM1is'),
        new web3_js_1.PublicKey('2N92457ubvpj1Q1mVpbSuw5QDmDb6dpzNUa6PwVuCvSm'),
        new web3_js_1.PublicKey('3piGZRqykLKmKob42id8E61NnHqyrhWE2kziWmHZ7zqV'),
        new web3_js_1.PublicKey('Frpbn2b7sA6Vy1Zbz35kbgVNRkXu3tSexqJJXJRwPV6w'),
    ];
    console.log('nftMintList ==>', nftMintList.map((nftMint) => nftMint.toBase58()));
    const { instructionsList } = await config_js_1.chain.collectAllPositionFeesInstructions({
        userAddress: config_js_1.userAddress,
        nftMintList,
    });
    for (const instructions of instructionsList) {
        console.log('Start sending transaction ==>');
        const transaction = await (0, index_js_1.makeTransaction)({
            connection: config_js_1.connection,
            payerPublicKey: config_js_1.userAddress,
            instructions,
        });
        const txid = await (0, index_js_1.sendTransaction)({
            connection: config_js_1.connection,
            signTx: () => (0, config_js_1.signerCallback)(transaction),
        });
        console.log('Collect fees successfully, txid:', txid);
    }
}
main();
