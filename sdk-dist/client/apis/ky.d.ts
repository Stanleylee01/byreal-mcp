import { Input, Options, KyInstance } from 'ky';
export declare class RequestError extends Error {
    code?: number;
    url?: string;
    constructor(message: string, code?: number, url?: string);
}
export interface IApiInstanceResp<T> {
    data: T;
    retCode: number;
    retMsg: string;
    success: boolean;
}
export type ApiInstance = {
    get<T>(input: Input, options?: Options & {
        params?: Record<string, any>;
    }): Promise<IApiInstanceResp<T>>;
    post<T>(input: Input, options?: Options): Promise<IApiInstanceResp<T>>;
    put<T>(input: Input, options?: Options): Promise<IApiInstanceResp<T>>;
    delete<T>(input: Input, options?: Options): Promise<IApiInstanceResp<T>>;
    _kyInstance: KyInstance;
    _ky: KyInstance;
};
/**
 *
 * // GET
const { data } = await api.get('your/path', { searchParams: { foo: 1 } });

// POST
const { data } = await api.post('your/path', { json: { foo: 1 } });

// PUT
const { data } = await api.put('your/path', { json: { foo: 1 } });

// DELETE
const { data } = await api.delete('your/path');
 *
 * @param baseURL
 * @param timeout
 * @returns
 */
export declare function createApiInstance(baseURL: string, timeout?: number): ApiInstance;
