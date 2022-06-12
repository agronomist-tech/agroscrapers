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
    mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/agronomist",
    clickhouseHost: process.env.CLICKHOUSE_HOST || "localhost",
    clickhousePort: process.env.CLICKHOUSE_PORT ? parseInt(process.env.CLICKHOUSE_PORT) : 9000,
    clickhouseDatabase: process.env.CLICKHOUSE_DATABASE || "agronomist"
};
var solanaConnection = new web3_js_1.Connection(config.solanaUrl);
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
function processing() {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var mongo, ch, tokens, _b, _c, _i, token, resp, liquidityPools, _loop_1, _d, _e, lp, _loop_2, _f, _g, lp, farms, _h, farms_1, farm, farmInfo;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: return [4 /*yield*/, (0, mongo_1.makeMongo)(config.mongoUrl)];
                case 1:
                    mongo = _j.sent();
                    return [4 /*yield*/, (0, ch_1.makeClickhouse)(config.clickhouseHost, config.clickhousePort, config.clickhouseDatabase)];
                case 2:
                    ch = _j.sent();
                    console.log("Get tokens from raydium");
                    return [4 /*yield*/, getTokens()];
                case 3:
                    tokens = _j.sent();
                    console.log("Received ".concat(tokens.length, " tokens"));
                    _b = [];
                    for (_c in tokens)
                        _b.push(_c);
                    _i = 0;
                    _j.label = 4;
                case 4:
                    if (!(_i < _b.length)) return [3 /*break*/, 7];
                    token = _b[_i];
                    return [4 /*yield*/, mongo_1.TokenModel.updateOne({
                            name: tokens[token].name,
                            symbol: tokens[token].symbol,
                            mint: token,
                            icon: tokens[token].icon,
                            decimal: tokens[token].decimal,
                            source: "raydium"
                        }, {}, { upsert: true })];
                case 5:
                    _j.sent();
                    _j.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    console.log("Get list of liquidity pools");
                    return [4 /*yield*/, axios_1["default"].get("https://api.raydium.io/v2/sdk/liquidity/mainnet.json")];
                case 8:
                    resp = _j.sent();
                    return [4 /*yield*/, resp.data];
                case 9:
                    liquidityPools = _j.sent();
                    console.log("Received official ".concat(liquidityPools["official"].length, " liquidity pools"));
                    console.log("Received unofficial ".concat(liquidityPools["unOfficial"].length, " liquidity pools"));
                    _loop_1 = function (lp) {
                        var poolInfo, e_1;
                        return __generator(this, function (_k) {
                            switch (_k.label) {
                                case 0:
                                    console.log("Save lpool ".concat(lp.id));
                                    return [4 /*yield*/, mongo_1.LPoolModel.updateOne({
                                            id: lp.id.toString(),
                                            lpMint: lp.lpMint.toString(),
                                            baseMint: lp.baseMint.toString(),
                                            quoteMint: lp.quoteMint.toString(),
                                            lpDecimal: lp.lpDecimals,
                                            baseDecimal: lp.baseDecimals,
                                            quoteDecimal: lp.quoteDecimals,
                                            lpVault: lp.lpVault,
                                            programId: lp.programId,
                                            baseVault: lp.baseVault,
                                            quoteVault: lp.quoteVault,
                                            comment: "official"
                                        }, {}, { upsert: true })];
                                case 1:
                                    _k.sent();
                                    Object.keys(lp).map(function (key) { return lp[key] = new web3_js_1.PublicKey(lp[key]); });
                                    poolInfo = void 0;
                                    _k.label = 2;
                                case 2:
                                    _k.trys.push([2, 4, , 5]);
                                    console.log("Get info for ".concat(lp.id));
                                    return [4 /*yield*/, raydium_sdk_1.Liquidity.fetchInfo({
                                            connection: solanaConnection,
                                            poolKeys: lp
                                        })];
                                case 3:
                                    poolInfo = _k.sent();
                                    return [3 /*break*/, 5];
                                case 4:
                                    e_1 = _k.sent();
                                    console.log("Can't get pool info: ".concat(e_1));
                                    return [2 /*return*/, "continue"];
                                case 5:
                                    if (!poolInfo) return [3 /*break*/, 7];
                                    console.log("Save info for ".concat(lp.id));
                                    return [4 /*yield*/, ch.insert("INSERT INTO lpools (address, base, quote, liquidity, date)", {
                                            address: lp.id.toString(),
                                            base: poolInfo.baseReserve.toString(),
                                            quote: poolInfo.quoteReserve.toString(),
                                            liquidity: poolInfo.lpSupply.toString(),
                                            date: new Date()
                                        }).toPromise()];
                                case 6:
                                    _k.sent();
                                    _k.label = 7;
                                case 7: return [2 /*return*/];
                            }
                        });
                    };
                    _d = 0, _e = liquidityPools["official"];
                    _j.label = 10;
                case 10:
                    if (!(_d < _e.length)) return [3 /*break*/, 13];
                    lp = _e[_d];
                    return [5 /*yield**/, _loop_1(lp)];
                case 11:
                    _j.sent();
                    _j.label = 12;
                case 12:
                    _d++;
                    return [3 /*break*/, 10];
                case 13:
                    _loop_2 = function (lp) {
                        var poolInfo, e_2;
                        return __generator(this, function (_l) {
                            switch (_l.label) {
                                case 0: return [4 /*yield*/, mongo_1.LPoolModel.updateOne({
                                        id: lp.id.toString(),
                                        lpMint: lp.lpMint.toString(),
                                        baseMint: lp.baseMint.toString(),
                                        quoteMint: lp.quoteMint.toString(),
                                        lpDecimal: lp.lpDecimals,
                                        baseDecimal: lp.baseDecimals,
                                        quoteDecimal: lp.quoteDecimals,
                                        lpVault: lp.lpVault,
                                        programId: lp.programId,
                                        baseVault: lp.baseVault,
                                        quoteVault: lp.quoteVault,
                                        comment: "unofficial"
                                    }, {}, { upsert: true })];
                                case 1:
                                    _l.sent();
                                    Object.keys(lp).map(function (key) { return lp[key] = new web3_js_1.PublicKey(lp[key]); });
                                    poolInfo = void 0;
                                    _l.label = 2;
                                case 2:
                                    _l.trys.push([2, 4, , 5]);
                                    console.log("Get info for ".concat(lp.id));
                                    return [4 /*yield*/, raydium_sdk_1.Liquidity.fetchInfo({
                                            connection: solanaConnection,
                                            poolKeys: lp
                                        })];
                                case 3:
                                    poolInfo = _l.sent();
                                    return [3 /*break*/, 5];
                                case 4:
                                    e_2 = _l.sent();
                                    console.log("Can't get pool info: ".concat(e_2));
                                    return [2 /*return*/, "continue"];
                                case 5:
                                    if (!poolInfo) return [3 /*break*/, 7];
                                    console.log("Save info for ".concat(lp.id));
                                    return [4 /*yield*/, ch.insert("INSERT INTO lpools (address, base, quote, liquidity, date)", {
                                            address: lp.id.toString(),
                                            base: poolInfo.baseReserve.toString(),
                                            quote: poolInfo.quoteReserve.toString(),
                                            liquidity: poolInfo.lpSupply.toString(),
                                            date: new Date()
                                        }).toPromise()];
                                case 6:
                                    _l.sent();
                                    _l.label = 7;
                                case 7: return [2 /*return*/];
                            }
                        });
                    };
                    _f = 0, _g = liquidityPools["unOfficial"];
                    _j.label = 14;
                case 14:
                    if (!(_f < _g.length)) return [3 /*break*/, 17];
                    lp = _g[_f];
                    return [5 /*yield**/, _loop_2(lp)];
                case 15:
                    _j.sent();
                    _j.label = 16;
                case 16:
                    _f++;
                    return [3 /*break*/, 14];
                case 17:
                    console.log("Get list of farm pools");
                    return [4 /*yield*/, getFarmPools()];
                case 18:
                    farms = _j.sent();
                    console.log("Received ".concat(farms.length, " farm pools"));
                    _h = 0, farms_1 = farms;
                    _j.label = 19;
                case 19:
                    if (!(_h < farms_1.length)) return [3 /*break*/, 24];
                    farm = farms_1[_h];
                    console.log("Save farm ".concat(farm.id));
                    return [4 /*yield*/, mongo_1.FarmModel.updateOne({
                            id: farm.id.toString(),
                            lpMint: farm.lpMint.toString(),
                            programId: farm.programId.toString(),
                            lpVault: farm.lpVault.toString(),
                            rewardMints: farm.rewardMints.map(function (rewardMint) { return rewardMint.toString(); }),
                            rewardVaults: farm.rewardVaults.map(function (rewardVault) { return rewardVault.toString(); })
                        }, {}, { upsert: true })];
                case 20:
                    _j.sent();
                    return [4 /*yield*/, raydium_sdk_1.Farm.fetchMultipleInfo({
                            connection: solanaConnection,
                            pools: [farm]
                        })];
                case 21:
                    farmInfo = _j.sent();
                    if (!farmInfo) return [3 /*break*/, 23];
                    console.log("Save info for farm ".concat(farm.id));
                    return [4 /*yield*/, ch.insert("INSERT INTO farms (address, rewards, amount, date)", {
                            address: farm.id.toString(),
                            rewards: farmInfo[farm.id.toString()].state.totalRewards.map(function (reward) { return reward.toString(); }),
                            amount: farmInfo[farm.id.toString()].lpVault.amount.toString(),
                            date: new Date()
                        }).toPromise()];
                case 22:
                    _j.sent();
                    _j.label = 23;
                case 23:
                    _h++;
                    return [3 /*break*/, 19];
                case 24: return [4 /*yield*/, ((_a = mongo.connection) === null || _a === void 0 ? void 0 : _a.close())];
                case 25:
                    _j.sent();
                    return [2 /*return*/];
            }
        });
    });
}
processing();
