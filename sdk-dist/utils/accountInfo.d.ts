import { Mint, getTransferFeeConfig } from '@solana/spl-token';
import { AccountInfo, Commitment, Connection, PublicKey } from '@solana/web3.js';
export interface ReturnTypeFetchMultipleMintInfos {
    [mint: string]: Mint & {
        feeConfig: ReturnType<typeof getTransferFeeConfig> | undefined;
        programId: PublicKey;
    };
}
export interface GetMultipleAccountsInfoConfig {
    batchRequest?: boolean;
    commitment?: Commitment;
    chunkCount?: number;
}
export declare function getMultipleAccountsInfo(connection: Connection, publicKeys: PublicKey[], config?: GetMultipleAccountsInfoConfig): Promise<(AccountInfo<Buffer> | null)[]>;
export declare function getMultipleAccountsInfoWithCustomFlags<T extends {
    pubkey: PublicKey;
}>(connection: Connection, publicKeysWithCustomFlag: T[], config?: GetMultipleAccountsInfoConfig): Promise<({
    accountInfo: AccountInfo<Buffer> | null;
} & T)[]>;
export declare function fetchMultipleMintInfos({ connection, mints, config, }: {
    connection: Connection;
    mints: PublicKey[];
    config?: {
        batchRequest?: boolean;
    };
}): Promise<ReturnTypeFetchMultipleMintInfos>;
