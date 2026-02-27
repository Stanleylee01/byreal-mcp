import { AccountInfo, Commitment, Connection, GetProgramAccountsResponse, PublicKey, RpcResponseAndContext } from '@solana/web3.js';
import BN from 'bn.js';
import { SPLTokenAccountLayout } from '../layout.js';
import { GetStructureSchema } from '../libs/marshmallow/index.js';
export interface ParseTokenAccount {
    owner: PublicKey;
    solAccountResp?: AccountInfo<Buffer> | null;
    tokenAccountResp: RpcResponseAndContext<GetProgramAccountsResponse>;
}
export type ISPLTokenAccount = GetStructureSchema<typeof SPLTokenAccountLayout>;
export interface TokenAccountRaw {
    programId: PublicKey;
    pubkey: PublicKey;
    accountInfo: ISPLTokenAccount;
}
export interface TokenAccount {
    publicKey?: PublicKey;
    mint: PublicKey;
    isAssociated?: boolean;
    amount: BN;
    isNative: boolean;
    programId: PublicKey;
}
/**
 * Get all token account information in the wallet (pure function version)
 *
 * This function will simultaneously query user's SOL account, standard SPL token accounts, and Token-2022 accounts.
 *
 * @param connection - Solana connection instance
 * @param ownerPubKey - Public key of the wallet owner
 * @param commitment - Optional commitment level
 * @returns Promise containing token accounts and raw account information
 */
export declare function fetchWalletTokenAccounts(connection: Connection, ownerPubKey: PublicKey, commitment?: Commitment): Promise<{
    tokenAccounts: TokenAccount[];
    rawTokenAccountInfos: TokenAccountRaw[];
}>;
export declare function parseTokenAccountResp({ owner, solAccountResp, tokenAccountResp }: ParseTokenAccount): {
    tokenAccounts: TokenAccount[];
    rawTokenAccountInfos: TokenAccountRaw[];
};
