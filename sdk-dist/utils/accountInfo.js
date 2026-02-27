import { MINT_SIZE, TOKEN_PROGRAM_ID, getTransferFeeConfig, unpackMint } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { chunk } from 'lodash-es';
import { WSOLMint } from '../constants.js';
import { solToWSol } from './validateAndParsePublicKey.js';
export async function getMultipleAccountsInfo(connection, publicKeys, config) {
    const { batchRequest, commitment = 'confirmed', chunkCount = 100, } = {
        batchRequest: false,
        ...config,
    };
    const chunkedKeys = chunk(publicKeys, chunkCount);
    let results = new Array(chunkedKeys.length).fill([]);
    if (batchRequest) {
        const batch = chunkedKeys.map((keys) => {
            const args = connection._buildArgs([keys.map((key) => key.toBase58())], commitment, 'base64');
            return {
                methodName: 'getMultipleAccounts',
                args,
            };
        });
        const _batch = chunk(batch, 10);
        const unsafeResponse = await (await Promise.all(_batch.map(async (i) => await connection._rpcBatchRequest(i)))).flat();
        results = unsafeResponse.map((unsafeRes) => {
            if (unsafeRes.error)
                console.error(`failed to get info for multiple accounts, RPC_ERROR, ${unsafeRes.error.message}`);
            return unsafeRes.result.value.map((accountInfo) => {
                if (accountInfo) {
                    const { data, executable, lamports, owner, rentEpoch } = accountInfo;
                    if (data.length !== 2 && data[1] !== 'base64') {
                        console.error(`info must be base64 encoded, RPC_ERROR`);
                    }
                    return {
                        data: Buffer.from(data[0], 'base64'),
                        executable,
                        lamports,
                        owner: new PublicKey(owner),
                        rentEpoch,
                    };
                }
                return null;
            });
        });
    }
    else {
        try {
            results = (await Promise.all(chunkedKeys.map((keys) => connection.getMultipleAccountsInfo(keys, commitment))));
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`failed to get info for multiple accounts, RPC_ERROR, ${error.message}`);
            }
        }
    }
    return results.flat();
}
export async function getMultipleAccountsInfoWithCustomFlags(connection, publicKeysWithCustomFlag, config) {
    const multipleAccountsInfo = await getMultipleAccountsInfo(connection, publicKeysWithCustomFlag.map((o) => o.pubkey), config);
    return publicKeysWithCustomFlag.map((o, idx) => ({ ...o, accountInfo: multipleAccountsInfo[idx] }));
}
export async function fetchMultipleMintInfos({ connection, mints, config, }) {
    if (mints.length === 0)
        return {};
    const mintInfos = await getMultipleAccountsInfoWithCustomFlags(connection, mints.map((i) => ({ pubkey: solToWSol(i) })), config);
    const mintK = {};
    for (const i of mintInfos) {
        if (!i.accountInfo || i.accountInfo.data.length < MINT_SIZE) {
            console.log('invalid mint account', i.pubkey.toBase58());
            continue;
        }
        const t = unpackMint(i.pubkey, i.accountInfo, i.accountInfo?.owner);
        mintK[i.pubkey.toString()] = {
            ...t,
            programId: i.accountInfo?.owner || TOKEN_PROGRAM_ID,
            feeConfig: getTransferFeeConfig(t) ?? undefined,
        };
    }
    mintK[PublicKey.default.toBase58()] = mintK[WSOLMint.toBase58()];
    return mintK;
}
