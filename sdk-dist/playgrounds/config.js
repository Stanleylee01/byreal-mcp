"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolAddress = exports.TokenAddress = exports.signerCallback = exports.chain = exports.userAddress = exports.userKeypair = exports.connection = void 0;
const path_1 = __importDefault(require("path"));
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const index_js_1 = require("../client/index.js");
const constants_js_1 = require("../constants.js");
const endpoint = process.env.SOL_ENDPOINT || (0, web3_js_1.clusterApiUrl)('mainnet-beta');
const secretKey = process.env.SOL_SECRET_KEY;
if (!secretKey) {
    throw new Error('Please set your SOL_SECRET_KEY in .env');
}
exports.connection = new web3_js_1.Connection(endpoint);
exports.userKeypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(secretKey));
exports.userAddress = exports.userKeypair.publicKey;
exports.chain = new index_js_1.Chain({ connection: exports.connection, programId: constants_js_1.BYREAL_CLMM_PROGRAM_ID });
const signerCallback = async (tx) => {
    tx.sign([exports.userKeypair]);
    return tx;
};
exports.signerCallback = signerCallback;
exports.TokenAddress = {
    USDC: new web3_js_1.PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    USDT: new web3_js_1.PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    SOL: new web3_js_1.PublicKey('So11111111111111111111111111111111111111112'),
    BBSOL: new web3_js_1.PublicKey('Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B'),
};
exports.PoolAddress = {
    SOL_BBSOL: new web3_js_1.PublicKey('87pbGHxigtjdMovzkAAFEe8XFVTETjDomoEFfpSFd2yD'),
    USDC_USDT: new web3_js_1.PublicKey('23XoPQqGw9WMsLoqTu8HMzJLD6RnXsufbKyWPLJywsCT'),
    SOL_USDC: new web3_js_1.PublicKey('9GTj99g9tbz9U6UYDsX6YeRTgUnkYG6GTnHv3qLa5aXq'),
};
