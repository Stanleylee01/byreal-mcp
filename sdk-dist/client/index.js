import { BYREAL_CLMM_PROGRAM_ID } from '../constants.js';
import { Api } from './apis/index.js';
import { Chain } from './chain/index.js';
import { CLMMClient } from './liquidity/clmm.js';
import { Token } from './token.js';
export class SdkClient {
    api;
    chain;
    clmmClient;
    connection;
    programId;
    token;
    constructor(params) {
        const { connection, programId = BYREAL_CLMM_PROGRAM_ID, apiConfig } = params;
        this.connection = connection;
        this.programId = programId;
        this.api = new Api(apiConfig);
        this.chain = new Chain({ connection, programId });
        this.clmmClient = new CLMMClient({ chain: this.chain });
        this.token = new Token(connection);
    }
    // Get pool list
    async getPools(req) {
        return this.api.getPools(req);
    }
    // Get pool details by ids
    async getPoolsByIds(req) {
        const result = await this.api.getPoolsByIds(req);
        return result;
    }
    // Get user positions
    async getMyPositions(req) {
        return this.api.getMyPositions(req);
    }
    // Collect single position fees
    collectFees(params) {
        return this.chain.collectFees(params);
    }
    // Get tick information
    async getTicks(req) {
        return this.api.getTicks(req);
    }
    /**
     *
     * @param id Pool address
     * @returns
     */
    async getRawPoolInfoByPoolId(id) {
        return this.chain.getRawPoolInfoByPoolId(id);
    }
    async getPositionNftMintListByUserAddress(userAddress) {
        const positionList = await this.chain.getRawPositionInfoListByUserAddress(userAddress);
        return positionList.map((position) => position.nftMint);
    }
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
