import { PoolInfo } from './poolsModels.js';
export interface IMyPositionsReq {
    userAddress: string;
}
export interface IMyPositionsResp {
    positions: IPosition[];
    poolMap: IPoolMap;
}
export interface IPosition {
    activeBurnNft: boolean;
    lpNftMintAddress: string;
    lpNftTokenAddress: string;
    lpProviderAddress: string;
    personalPositionAddress: string;
    poolAddress: string;
}
export interface IPoolMap {
    [address: string]: PoolInfo;
}
