/**
 * Sign an unsigned base64 transaction via Privy and broadcast to Solana.
 *
 * Input (env vars):
 *   UNSIGNED_TX    - base64 encoded unsigned VersionedTransaction
 *   SOL_ENDPOINT   - optional RPC endpoint
 *
 * Uses sawal's Privy credentials from ~/.sawal/
 *
 * Output (stdout): JSON { signature: string }
 */
import { Connection } from '@solana/web3.js';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
const CONFIG_DIR = path.join(os.homedir(), '.sawal');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const WALLET_FILE = path.join(CONFIG_DIR, 'wallet.json');
const PRIVY_API_URL = 'https://api.privy.io';
async function main() {
    const unsignedTxB64 = process.env.UNSIGNED_TX;
    const rpc = process.env.SOL_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    if (!unsignedTxB64)
        throw new Error('Missing UNSIGNED_TX env var');
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    const wallet = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
    // Privy Basic Auth (same as sawal)
    const auth = Buffer.from(`${config.privyAppId}:${config.privyAppSecret}`).toString('base64');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'privy-app-id': config.privyAppId,
    };
    const connection = new Connection(rpc);
    // Sign via Privy
    const resp = await axios.post(`${PRIVY_API_URL}/v1/wallets/${wallet.id}/rpc`, {
        method: 'signTransaction',
        params: { transaction: unsignedTxB64, encoding: 'base64' },
    }, { headers });
    const d = resp.data?.data;
    let signedBuf;
    if (typeof d === 'string')
        signedBuf = Buffer.from(d, 'base64');
    else if (d?.signed_transaction)
        signedBuf = Buffer.from(d.signed_transaction, 'base64');
    else if (d?.signedTransaction)
        signedBuf = Buffer.from(d.signedTransaction, 'base64');
    else
        throw new Error('Unexpected Privy response: ' + JSON.stringify(resp.data));
    // Broadcast
    const signature = await connection.sendRawTransaction(signedBuf, {
        skipPreflight: false,
        maxRetries: 3,
    });
    // Wait for confirmation
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
    process.stdout.write(JSON.stringify({ signature }) + '\n');
}
main().catch((e) => {
    process.stderr.write('[sign-and-send] Error: ' + e.message + '\n');
    process.exit(1);
});
