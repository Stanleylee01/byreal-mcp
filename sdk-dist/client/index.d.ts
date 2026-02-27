import { Connection, PublicKey } from '@solana/web3.js';
import { IPoolLayoutWithId } from '../instructions/models.js';
import { Api, IApiParams } from './apis/index.js';
import { IPoolsReq, IPoolsByIdsReq } from './apis/poolsModels.js';
import { IMyPositionsReq } from './apis/positionModels.js';
import { ITickReq } from './apis/tickModels.js';
import { Chain } from './chain/index.js';
import { ICollectFeesParams } from './chain/models.js';
import { ParamsWithSignerCallback } from './chain/models.js';
import { CLMMClient } from './liquidity/clmm.js';
import { Token } from './token.js';
export declare class SdkClient {
    api: Api;
    chain: Chain;
    clmmClient: CLMMClient;
    connection: Connection;
    programId: PublicKey;
    token: Token;
    constructor(params: {
        connection: Connection;
        programId?: PublicKey;
        apiConfig?: IApiParams;
    });
    getPools(req: IPoolsReq): Promise<import("./index.js").IApiInstanceResp<import("./index.js").IPoolsResp>>;
    getPoolsByIds(req: IPoolsByIdsReq): Promise<import("./index.js").IApiInstanceResp<import("./index.js").IPoolsResp>>;
    getMyPositions(req: IMyPositionsReq): Promise<import("./index.js").IApiInstanceResp<import("./index.js").IMyPositionsResp>>;
    collectFees(params: ParamsWithSignerCallback<ICollectFeesParams>): Promise<string>;
    getTicks(req: ITickReq): Promise<import("./index.js").IApiInstanceResp<import("./index.js").ITick[]>>;
    /**
     *
     * @param id Pool address
     * @returns
     */
    getRawPoolInfoByPoolId(id: string): Promise<IPoolLayoutWithId>;
    getPositionNftMintListByUserAddress(userAddress: PublicKey): Promise<PublicKey[]>;
}
export * from './chain/index.js';
export * from './chain/models.js';
export * from './apis/index.js';
export * from './apis/ky.js';
export * from './liquidity/clmm.js';
export * from './apis/poolsModels.js';
export * from './apis/swapModels.js';
export * from './apis/positionModels.js';
export * from './apis/tickModels.js';
