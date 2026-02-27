import { IDynamicFeeResp } from './commonModels.js';
import { ApiInstance } from './ky.js';
import { IPoolsByIdsReq, IPoolsReq, IPoolsResp } from './poolsModels.js';
import { IMyPositionsReq, IMyPositionsResp } from './positionModels.js';
import { ITick, ITickReq } from './tickModels.js';
export type Cluster = 'mainnet' | 'devnet';
export declare const API_URLS: {
    BASE_HOST: string;
    SWAP: string;
    POOL_INFO_LIST: string;
    POOL_INFO_BY_IDS: string;
    MY_POSITIONS: string;
    TICK: string;
    DYNAMIC_FEE: string;
};
export type ApiConfigInfo = Partial<typeof API_URLS>;
export interface IApiParams {
    cluster: Cluster;
    timeout: number;
    urlConfigs: ApiConfigInfo;
}
export declare class Api {
    cluster: Cluster;
    api: ApiInstance;
    urlConfigs: ApiConfigInfo;
    constructor(params?: IApiParams);
    getPools(params: IPoolsReq): Promise<import("./ky.js").IApiInstanceResp<IPoolsResp>>;
    getPoolsByIds(params: IPoolsByIdsReq): Promise<import("./ky.js").IApiInstanceResp<IPoolsResp>>;
    getMyPositions(params: IMyPositionsReq): Promise<import("./ky.js").IApiInstanceResp<IMyPositionsResp>>;
    getTicks(params: ITickReq): Promise<import("./ky.js").IApiInstanceResp<ITick[]>>;
    getDynamicFee(): Promise<import("./ky.js").IApiInstanceResp<IDynamicFeeResp>>;
}
