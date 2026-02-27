import { PublicKey } from '@solana/web3.js';
export declare const AMM_CONFIG_SEED: Buffer<ArrayBuffer>;
export declare const POOL_SEED: Buffer<ArrayBuffer>;
export declare const POOL_VAULT_SEED: Buffer<ArrayBuffer>;
export declare const POOL_REWARD_VAULT_SEED: Buffer<ArrayBuffer>;
export declare const POSITION_SEED: Buffer<ArrayBuffer>;
export declare const TICK_ARRAY_SEED: Buffer<ArrayBuffer>;
export declare const OPERATION_SEED: Buffer<ArrayBuffer>;
export declare const POOL_TICK_ARRAY_BITMAP_SEED: Buffer<ArrayBuffer>;
export declare const OBSERVATION_SEED: Buffer<ArrayBuffer>;
export declare const SUPPORT_MINT_SEED: Buffer<ArrayBuffer>;
export declare function getPdaAmmConfigId(programId: PublicKey, index: number): {
    publicKey: PublicKey;
    nonce: number;
};
export declare function getPdaPoolId(programId: PublicKey, ammConfigId: PublicKey, mintA: PublicKey, mintB: PublicKey): {
    publicKey: PublicKey;
    nonce: number;
};
export declare function getPdaPoolVaultId(programId: PublicKey, poolId: PublicKey, vaultMint: PublicKey): {
    publicKey: PublicKey;
    nonce: number;
};
export declare function getPdaTickArrayAddress(programId: PublicKey, poolId: PublicKey, startIndex: number): {
    publicKey: PublicKey;
    nonce: number;
};
export declare function getPdaProtocolPositionAddress(programId: PublicKey, poolId: PublicKey, tickLower: number, tickUpper: number): {
    publicKey: PublicKey;
    nonce: number;
};
export declare function getPdaPersonalPositionAddress(programId: PublicKey, nftMint: PublicKey): {
    publicKey: PublicKey;
    nonce: number;
};
export declare function getPdaExBitmapAccount(programId: PublicKey, poolId: PublicKey): {
    publicKey: PublicKey;
    nonce: number;
};
export declare function getPdaObservationAccount(programId: PublicKey, poolId: PublicKey): {
    publicKey: PublicKey;
    nonce: number;
};
export declare function getPdaMintExAccount(programId: PublicKey, mintAddress: PublicKey): {
    publicKey: PublicKey;
    nonce: number;
};
export declare function getATAAddress(owner: PublicKey, mint: PublicKey, programId?: PublicKey): {
    publicKey: PublicKey;
    nonce: number;
};
