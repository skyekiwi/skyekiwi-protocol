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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanup = exports.downstreamPath = exports.setup = exports.del = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const tweetnacl_1 = require("tweetnacl");
const SkyeKiwi = __importStar(require("../src/index"));
let files_path = [];
async function del(file) {
    return new Promise((res, rej) => {
        fs_1.default.unlink(file, (err) => {
            if (err)
                rej(err);
            res(true);
        });
    });
}
exports.del = del;
async function setup(num) {
    let files = [];
    for (let i = 0; i < num; i++) {
        const content = tweetnacl_1.randomBytes(12000000);
        const filePath = path_1.default.join(__dirname, `/tmp/${i}.file`);
        files_path.push(filePath);
        try {
            await del(filePath);
        }
        catch (err) {
            //pass
        }
        await SkyeKiwi.File.writeFile(Buffer.from(content), filePath, 'a');
        files.push({
            file: new SkyeKiwi.File({
                fileName: `/tmp/${i}.file`,
                readStream: fs_1.default.createReadStream(filePath, { highWaterMark: 1 * (10 ** 8) })
            }),
            content: content
        });
    }
    return files;
}
exports.setup = setup;
function downstreamPath(num) {
    const x = path_1.default.join(__dirname, `/tmp/down${num}.file`);
    files_path.push(x);
    return x;
}
exports.downstreamPath = downstreamPath;
const cleanup = async () => {
    for (let p of files_path) {
        try {
            await del(p);
        }
        catch (err) { }
    }
};
exports.cleanup = cleanup;
//# sourceMappingURL=setup.js.map