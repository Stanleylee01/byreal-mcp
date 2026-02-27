import { PublicKey } from '@solana/web3.js';
export declare function generatePubKey({ fromPublicKey, programId, assignSeed, }: {
    fromPublicKey: PublicKey;
    programId: PublicKey;
    assignSeed?: string;
}): {
    publicKey: PublicKey;
    seed: string;
};
