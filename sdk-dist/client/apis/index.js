import { createApiInstance } from './ky.js';
export const API_URLS = {
    BASE_HOST: 'https://your-api-host.com',
    // ========= swap scenario =========
    // Price inquiry
    SWAP: 'swap',
    // ========= Others =========
    // Get pool information
    POOL_INFO_LIST: 'dex/v1/pools/info/list',
    POOL_INFO_BY_IDS: 'dex/v1/pools/info/ids',
    // Get user positions
    MY_POSITIONS: 'dex/v1/position/list',
    // Get tick information
    TICK: 'router/v1/query-service/list-line-position',
    // Dynamic fees
    DYNAMIC_FEE: 'dex/v1/main/auto-fee',
};
export class Api {
    cluster;
    api;
    urlConfigs = API_URLS;
    constructor(params) {
        const { cluster = 'mainnet', timeout = 10000, urlConfigs } = params || {};
        this.cluster = cluster;
        this.urlConfigs = {
            ...API_URLS,
            ...urlConfigs,
        };
        this.api = createApiInstance(this.urlConfigs.BASE_HOST || API_URLS.BASE_HOST, timeout);
    }
    async getPools(params) {
        const data = await this.api.get(`${this.urlConfigs.POOL_INFO_LIST || API_URLS.POOL_INFO_LIST}`, {
            params,
        });
        return data;
    }
    async getPoolsByIds(params) {
        const result = await this.api.get(`${this.urlConfigs.POOL_INFO_BY_IDS || API_URLS.POOL_INFO_BY_IDS}`, {
            params,
        });
        return result;
    }
    async getMyPositions(params) {
        const data = await this.api.get(`${this.urlConfigs.MY_POSITIONS || API_URLS.MY_POSITIONS}`, {
            params,
        });
        return data;
    }
    async getTicks(params) {
        const data = await this.api.get(this.urlConfigs.TICK || API_URLS.TICK, {
            params,
        });
        return data;
    }
    async getDynamicFee() {
        const data = await this.api.get(this.urlConfigs.DYNAMIC_FEE || API_URLS.DYNAMIC_FEE);
        return data;
    }
}
