import { MintLayout } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { IAmmConfigLayout, IObservationLayout, IPersonalPositionLayout } from './layout.js';
import { IPoolLayoutWithId } from './models.js';
export declare class RawDataUtils {
    /**
     * Get position list for specified account
     */
    static getRawPositionInfoListByUserAddress(params: {
        connection: Connection;
        programId: PublicKey;
        userAddress: PublicKey;
    }): Promise<IPersonalPositionLayout[]>;
    /**
     * Get position information from specified position list
     */
    static getRawPositionInfoByNftMint(params: {
        connection: Connection;
        programId: PublicKey;
        nftMint: PublicKey;
    }): Promise<IPersonalPositionLayout | null>;
    /**
     * Get on-chain information for a single CLMM pool
     */
    static getRawPoolInfoByPoolId(params: {
        connection: Connection;
        poolId: string | PublicKey;
    }): Promise<IPoolLayoutWithId | null>;
    /**
     * Get on-chain information for specified token
     */
    static getRawTokenInfoByMint(params: {
        connection: Connection;
        mintAddress: PublicKey;
    }): Promise<(ReturnType<typeof MintLayout.decode> & {
        owner: PublicKey;
    }) | null>;
    /**
     * Get AMM configuration on-chain information
     */
    static getRawAmmConfigByConfigId(params: {
        connection: Connection;
        configId: string | PublicKey;
    }): Promise<(IAmmConfigLayout & {
        configId: PublicKey;
        owner: PublicKey;
    }) | null>;
    /**
     * Get observation account on-chain information
     * Observation account is used to record historical data of price changes in the pool
     */
    static getRawObservationByObservationId(params: {
        connection: Connection;
        observationId: string | PublicKey;
    }): Promise<(IObservationLayout & {
        observationId: PublicKey;
        owner: PublicKey;
    }) | null>;
}
