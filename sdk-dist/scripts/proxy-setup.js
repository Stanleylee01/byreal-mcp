// Preload: make Node.js fetch respect HTTP_PROXY/HTTPS_PROXY
import { ProxyAgent, setGlobalDispatcher } from 'undici';
const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxy) {
    setGlobalDispatcher(new ProxyAgent(proxy));
}
