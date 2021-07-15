"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const SkyeKiwi = __importStar(require("../src/index"));
const chai_1 = require("chai");
const tweetnacl_1 = require("tweetnacl");
const SEED_PHRASE = 'riot hand shuffle card company must rocket jealous present hurt lava multiply';
describe('Blockchain', function () {
    this.timeout(0);
    const abi = SkyeKiwi.getAbi();
    console.log(SEED_PHRASE);
    it('Blockchain: send contract tx & storage order works', () => __awaiter(this, void 0, void 0, function* () {
        const mnemonic = SEED_PHRASE;
        const blockchain = new SkyeKiwi.Blockchain(mnemonic, '3gVh53DKMJMhQxNTc1fEegJFoZWvitpE7iCLPztDzSzef2Bg', 'wss://ws.jupiter-poa.patract.cn', 'wss://rocky-api.crust.network/', abi);
        yield blockchain.init();
        const ipfs = new SkyeKiwi.IPFS();
        const storage = blockchain.storage;
        const contract = blockchain.contract;
        let content = [];
        for (let i = 0; i < 3; i++) {
            content.push(yield ipfs.add(SkyeKiwi.Util.u8aToHex(tweetnacl_1.randomBytes(1000))));
        }
        //@ts-ignore
        const crustResult = yield storage.placeBatchOrderWithCIDList(content);
        // await storage.awaitNetworkFetching(content)
        chai_1.expect(crustResult).to.equal(true);
        const contractResult = yield contract.execContract('createVault', ['QmdaJf2gTKEzKpzNTJWcQVsrQVEaSAanPTrYhmsF12qgLm']);
        chai_1.expect(contractResult['ok']).to.be.a('number');
        yield ipfs.stopIfRunning();
    }));
});
//# sourceMappingURL=blockchain.test.js.map