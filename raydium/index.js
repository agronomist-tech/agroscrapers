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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var web3_js_1 = require("@solana/web3.js");
var raydium_sdk_1 = require("@raydium-io/raydium-sdk");
var axios_1 = require("axios");
var ch_1 = require("./ch");
var mongo_1 = require("./mongo");
var config = {
    solanaUrl: process.env.SOLANA_URL || "https://solana-api.projectserum.com",
    mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/",
    clickhouseHost: process.env.CLICKHOUSE_HOST || "localhost",
    clickhousePort: process.env.CLICKHOUSE_PORT ? parseInt(process.env.CLICKHOUSE_PORT) : 9000,
    clickhouseDatabase: process.env.CLICKHOUSE_DATABASE || "agronomist"
};
var solanaConnection = new web3_js_1.Connection(config.solanaUrl);
var sleep = function (time) {
    return new Promise(function (resolve) { return setTimeout(resolve, Math.ceil(time * 1000)); });
};
function getTokens() {
    return __awaiter(this, void 0, void 0, function () {
        var resp, tokensList, tokens;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1["default"].get("https://api.raydium.io/v2/sdk/token/raydium.mainnet.json")];
                case 1:
                    resp = _a.sent();
                    return [4 /*yield*/, resp.data];
                case 2:
                    tokensList = _a.sent();
                    tokens = {};
                    tokensList["official"].map(function (token) {
                        tokens[token.mint] = {
                            "name": token.name,
                            "symbol": token.symbol,
                            // @ts-ignore
                            "icon": token.icon,
                            "decimal": token.decimals
                        };
                    });
                    tokensList["unOfficial"].map(function (token) {
                        tokens[token.mint] = {
                            "name": token.name,
                            "symbol": token.symbol,
                            // @ts-ignore
                            "icon": token.icon,
                            "decimal": token.decimals
                        };
                    });
                    return [2 /*return*/, tokens];
            }
        });
    });
}
function getFarmPools() {
    return __awaiter(this, void 0, void 0, function () {
        var resp, pools;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1["default"].get("https://api.raydium.io/v2/sdk/farm/mainnet.json")];
                case 1:
                    resp = _a.sent();
                    return [4 /*yield*/, resp.data];
                case 2:
                    pools = _a.sent();
                    return [2 /*return*/, pools.official.map(function (pool) {
                            return {
                                "id": new web3_js_1.PublicKey(pool.id),
                                "lpMint": new web3_js_1.PublicKey(pool.lpMint),
                                "rewardMints": pool.rewardMints.map(function (rewardMint) { return new web3_js_1.PublicKey(rewardMint); }),
                                "version": pool.version,
                                "programId": new web3_js_1.PublicKey(pool.programId),
                                "authority": new web3_js_1.PublicKey(pool.authority),
                                "lpVault": new web3_js_1.PublicKey(pool.lpVault),
                                "rewardVaults": pool.rewardVaults.map(function (rewardVault) { return new web3_js_1.PublicKey(rewardVault); })
                            };
                        })];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tokens, liquidityPools, farmPools, _loop_1, _i, farmPools_1, pool;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Getting tokens...");
                    return [4 /*yield*/, getTokens()];
                case 1:
                    tokens = _a.sent();
                    console.log("Getting liquidity pools...");
                    return [4 /*yield*/, raydium_sdk_1.Liquidity.fetchAllPoolKeys(solanaConnection)];
                case 2:
                    liquidityPools = _a.sent();
                    console.log("Getting farm pools...");
                    return [4 /*yield*/, getFarmPools()];
                case 3:
                    farmPools = _a.sent();
                    console.log("Farms count: ".concat(farmPools.length));
                    console.log("Getting farm info...");
                    _loop_1 = function (pool) {
                        var lpPool, farmInfo, poolInfo;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    console.log("Start parse pool: ", pool.id.toString(), pool.lpMint.toString());
                                    lpPool = Array.from(liquidityPools).find(function (lp) {
                                        return lp.lpMint.toString() === pool.lpMint.toString();
                                    });
                                    if (!lpPool)
                                        return [2 /*return*/, "continue"];
                                    return [4 /*yield*/, raydium_sdk_1.Farm.fetchMultipleInfo({
                                            connection: solanaConnection,
                                            pools: [pool]
                                        })];
                                case 1:
                                    farmInfo = _b.sent();
                                    if (!lpPool) return [3 /*break*/, 3];
                                    return [4 /*yield*/, raydium_sdk_1.Liquidity.fetchInfo({
                                            connection: solanaConnection,
                                            poolKeys: lpPool
                                        })];
                                case 2:
                                    poolInfo = _b.sent();
                                    console.log("Farm Pool ID: ".concat(pool.id, " with tokens: ").concat(tokens[lpPool.quoteMint.toString()].name, " (").concat(poolInfo.quoteReserve, ") <-> ").concat(tokens[lpPool.baseMint.toString()].name, " (").concat(poolInfo.baseReserve, "): ").concat(farmInfo[pool.id.toString()].lpVault.amount.toString(), " (").concat(poolInfo.lpSupply, ")"));
                                    _b.label = 3;
                                case 3: return [4 /*yield*/, sleep(10)];
                                case 4:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, farmPools_1 = farmPools;
                    _a.label = 4;
                case 4:
                    if (!(_i < farmPools_1.length)) return [3 /*break*/, 7];
                    pool = farmPools_1[_i];
                    return [5 /*yield**/, _loop_1(pool)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function processing() {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var mongo, ch, farms, _i, farms_1, farm, farmInfo;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, mongo_1.makeMongo)(config.mongoUrl)];
                case 1:
                    mongo = _b.sent();
                    return [4 /*yield*/, (0, ch_1.makeClickhouse)(config.clickhouseHost, config.clickhousePort, config.clickhouseDatabase)];
                case 2:
                    ch = _b.sent();
                    return [4 /*yield*/, getFarmPools()];
                case 3:
                    farms = _b.sent();
                    _i = 0, farms_1 = farms;
                    _b.label = 4;
                case 4:
                    if (!(_i < farms_1.length)) return [3 /*break*/, 9];
                    farm = farms_1[_i];
                    return [4 /*yield*/, mongo_1.FarmModel.updateOne({
                            id: farm.id.toString(),
                            lpMint: farm.lpMint.toString(),
                            programId: farm.programId.toString(),
                            lpVault: farm.lpVault.toString(),
                            rewardMints: farm.rewardMints.map(function (rewardMint) { return rewardMint.toString(); }),
                            rewardVaults: farm.rewardVaults.map(function (rewardVault) { return rewardVault.toString(); })
                        }, {}, { upsert: true })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, raydium_sdk_1.Farm.fetchMultipleInfo({
                            connection: solanaConnection,
                            pools: [farm]
                        })];
                case 6:
                    farmInfo = _b.sent();
                    if (!farmInfo) return [3 /*break*/, 8];
                    return [4 /*yield*/, ch.insert("INSERT INTO farms (address, rewards, amount, date)", {
                            address: farm.id.toString(),
                            rewards: farmInfo[farm.id.toString()].state.totalRewards.map(function (reward) { return reward.toString(); }),
                            amount: farmInfo[farm.id.toString()].lpVault.amount.toString(),
                            date: new Date()
                        }).toPromise()];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 4];
                case 9: return [4 /*yield*/, ((_a = mongo.connection) === null || _a === void 0 ? void 0 : _a.close())];
                case 10:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
processing();
