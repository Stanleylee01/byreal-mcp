import ky from 'ky';
export class RequestError extends Error {
    code;
    url;
    constructor(message, code, url) {
        super(message);
        this.code = code;
        this.url = url;
    }
}
function handleResponseData(data, url) {
    const retCode = data?.ret_code ?? data?.retCode;
    if (retCode === 0) {
        return {
            // FIXME temporary adaptation for swap, will be modified later
            data: data.result.data || data.result,
            retCode: data.result.code || retCode,
            retMsg: data.result.msg,
            // FIXME temporary adaptation for swap, will be modified later
            success: data.result.success || true,
        };
    }
    else {
        throw new RequestError(data?.ret_msg || data?.retMsg || 'Unknown error', data?.ret_code || data?.retCode, url);
    }
}
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
export function createApiInstance(baseURL, timeout = 10000) {
    const kyInstance = ky.create({
        prefixUrl: baseURL,
        timeout,
        hooks: {
            afterResponse: [
                async (_request, _options, response) => {
                    const data = await response.clone().json();
                    const resp = handleResponseData(data, response.url);
                    // Key: wrap into Response object
                    return new Response(JSON.stringify(resp), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                    });
                },
            ],
        },
    });
    // Common request method
    async function request(input, options) {
        const result = await kyInstance(input, options).json();
        return result;
    }
    return {
        get: (input, options) => {
            let finalOptions = { method: 'get', ...options };
            if (options?.params) {
                finalOptions = {
                    ...finalOptions,
                    searchParams: options.params,
                };
                delete finalOptions.params;
            }
            return request(input, finalOptions);
        },
        post: (input, options) => request(input, { method: 'post', ...options }),
        put: (input, options) => request(input, { method: 'put', ...options }),
        delete: (input, options) => request(input, { method: 'delete', ...options }),
        _kyInstance: kyInstance,
        _ky: ky,
    };
}
