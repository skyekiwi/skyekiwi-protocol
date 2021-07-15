"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPFS = void 0;
const ipfs = require('ipfs-core');
const fetch = require('node-fetch');
const createClient = require('ipfs-http-client');
// import { Util } from '../index'
class IPFS {
    constructor() {
        this.localIpfsReady = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('init', this.localIpfs);
                this.localIpfsReady = true;
                this.localIpfs = yield ipfs.create();
            }
            catch (err) {
                console.error(err);
                // pass
                // this is where there is already an ipfs node running 
            }
        });
    }
    stopIfRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.localIpfsReady) {
                yield this.localIpfs.stop();
            }
        });
    }
    add(str) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const remoteResult = yield this.remoteGatewayAddAndPin(str);
                if (remoteResult !== null)
                    return remoteResult;
            }
            catch (err) {
                // pass
            }
            console.log(`all remote push failed, fallback to local IPFS, you need to keep the local IPFS running`);
            try {
                yield this.init();
                console.log(this.localIpfs);
                const cid = yield this.localIpfs.add(str);
                const fileStat = yield this.localIpfs.files.stat("/ipfs/" + cid.path);
                return {
                    cid: cid.path, size: fileStat.cumulativeSize
                };
            }
            catch (err) {
                console.error(err);
                throw (new Error('IPFS Failure: ipfs.add'));
            }
        });
    }
    cat(cid) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (cid.length !== 46) {
                throw new Error('cid length error: ipfs.cat');
            }
            try {
                const remoteResult = yield this.fetchFileFromRemote(cid);
                return remoteResult;
            }
            catch (err) {
                try {
                    let result = '';
                    yield this.init();
                    try {
                        for (var _b = __asyncValues(this.localIpfs.cat(cid)), _c; _c = yield _b.next(), !_c.done;) {
                            const chunk = _c.value;
                            result += chunk;
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return result;
                }
                catch (err) {
                    console.error(err);
                    throw (new Error('IPFS Failure: ipfs.cat'));
                }
            }
        });
    }
    addAndPinInfura(content) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("trying to pin to Infura")
            const infura = createClient({
                host: 'ipfs.infura.io',
                port: 5001,
                protocol: 'https',
                headers: {
                    'Access-Control-Request-Method': 'POST',
                    "Access-Control-Allow-Origin": '*',
                }
            });
            const infuraResult = yield infura.add(content);
            yield infura.pin.add(infuraResult.cid.toString());
            return {
                cid: infuraResult.path,
                size: infuraResult.size
            };
        });
    }
    addAndPinSkyeKiwi(content) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("trying to pin to SkyeKiwi")
            const skyekiwiNode = createClient({
                host: 'sgnode.skye.kiwi',
                port: 5001,
                protocol: 'http',
                headers: {
                    'Access-Control-Request-Method': 'POST',
                    "Access-Control-Allow-Origin": '*',
                }
            });
            const skyekiwiResult = yield skyekiwiNode.add(content);
            yield skyekiwiNode.pin.add(skyekiwiResult.cid.toString());
            return {
                cid: skyekiwiResult.path,
                size: skyekiwiResult.size
            };
        });
    }
    remoteGatewayAddAndPin(content) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.addAndPinSkyeKiwi(content);
            }
            catch (err) {
                console.error('skyekiwi pin', err);
                try {
                    return yield this.addAndPinInfura(content);
                }
                catch (err) {
                    console.error('infura pin', err);
                    throw new Error("all remote pin failed - ipfs.remoteGatewayAddAndPin");
                }
            }
        });
    }
    fetchFileFromRemote(cid) {
        var e_2, _a, e_3, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const requests = [
                    fetch(`http://ipfs.io/ipfs/${cid}`, { mode: 'no-cors' }),
                    fetch(`http://gateway.ipfs.io/ipfs/${cid}`, { mode: 'no-cors' }),
                    fetch(`http://gateway.originprotocol.com/ipfs/${cid}`, { mode: 'no-cors' }),
                    fetch(`http://ipfs.fleek.co/ipfs/${cid}`, { mode: 'no-cors' }),
                    fetch(`http://cloudflare-ipfs.com/ipfs/${cid}`, { mode: 'no-cors' })
                ];
                const result = yield Promise.race(requests);
                if (result.status != 200) {
                    throw new Error("public gateway non-200 response - ipfs.fetchFileFromRemote");
                }
                return yield result.text();
            }
            catch (err) {
                console.error('public gateway', err);
                try {
                    console.log("public gateway failed. Trying Infura");
                    const infura = createClient({
                        host: 'ipfs.infura.io',
                        port: 5001,
                        protocol: 'https',
                        headers: {
                            "Access-Control-Allow-Origin": '*',
                        }
                    });
                    let result = "";
                    const stream = infura.cat(cid);
                    try {
                        for (var stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), !stream_1_1.done;) {
                            const chunk = stream_1_1.value;
                            result += chunk.toString();
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (stream_1_1 && !stream_1_1.done && (_a = stream_1.return)) yield _a.call(stream_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    return result;
                }
                catch (err) {
                    console.error('infura gateway', err);
                    try {
                        console.log("public gateway & Infura failed. Trying SkyeKiwi");
                        const skyekiwiNode = createClient({
                            host: 'sgnode.skye.kiwi',
                            port: 5001,
                            protocol: 'http',
                            headers: {
                                "Access-Control-Allow-Origin": '*',
                            }
                        });
                        let result = "";
                        const stream = skyekiwiNode.cat(cid);
                        try {
                            for (var stream_2 = __asyncValues(stream), stream_2_1; stream_2_1 = yield stream_2.next(), !stream_2_1.done;) {
                                const chunk = stream_2_1.value;
                                result += chunk.toString();
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (stream_2_1 && !stream_2_1.done && (_b = stream_2.return)) yield _b.call(stream_2);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        return result;
                    }
                    catch (err) {
                        console.error('skyekiwi gateway', err);
                        throw new Error('remote file fetching failed - ipfs.fetchFileFromRemote');
                    }
                }
            }
        });
    }
}
exports.IPFS = IPFS;
//# sourceMappingURL=index.js.map