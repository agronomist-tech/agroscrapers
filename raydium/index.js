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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const axios_1 = __importDefault(require("axios"));
const ch_1 = require("./ch");
const mongo_1 = require("./mongo");
const config = {
    solanaUrl: process.env.SOLANA_URL || "https://solana-api.projectserum.com",
    mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/agronomist",
    clickhouseHost: process.env.CLICKHOUSE_HOST || "localhost",
    clickhousePort: process.env.CLICKHOUSE_PORT ? parseInt(process.env.CLICKHOUSE_PORT) : 9000,
    clickhouseDatabase: process.env.CLICKHOUSE_DATABASE || "agronomist",
};
const solanaConnection = new web3_js_1.Connection(config.solanaUrl);
function getTokens() {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = yield axios_1.default.get("https://api.raydium.io/v2/sdk/token/raydium.mainnet.json");
        const tokensList = yield resp.data;
        let tokens = {};
        tokensList["official"].map((token) => {
            tokens[token.mint] = {
                "name": token.name,
                "symbol": token.symbol,
                // @ts-ignore
                "icon": token.icon,
                "decimal": token.decimals
            };
        });
        tokensList["unOfficial"].map((token) => {
            tokens[token.mint] = {
                "name": token.name,
                "symbol": token.symbol,
                // @ts-ignore
                "icon": token.icon,
                "decimal": token.decimals
            };
        });
        return tokens;
    });
}
function getFarmPools() {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = yield axios_1.default.get("https://api.raydium.io/v2/sdk/farm/mainnet.json");
        const pools = yield resp.data;
        return pools.official.map((pool) => {
            return {
                "id": new web3_js_1.PublicKey(pool.id),
                "lpMint": new web3_js_1.PublicKey(pool.lpMint),
                "rewardMints": pool.rewardMints.map((rewardMint) => new web3_js_1.PublicKey(rewardMint)),
                "version": pool.version,
                "programId": new web3_js_1.PublicKey(pool.programId),
                "authority": new web3_js_1.PublicKey(pool.authority),
                "lpVault": new web3_js_1.PublicKey(pool.lpVault),
                "rewardVaults": pool.rewardVaults.map((rewardVault) => new web3_js_1.PublicKey(rewardVault)),
            };
        });
    });
}
function processing() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const mongo = yield (0, mongo_1.makeMongo)(config.mongoUrl);
        const ch = yield (0, ch_1.makeClickhouse)(config.clickhouseHost, config.clickhousePort, config.clickhouseDatabase);
        console.log("Get tokens from raydium");
        const tokens = yield getTokens();
        console.log(`Received ${tokens.length} tokens`);
        for (let token in tokens) {
            yield mongo_1.TokenModel.updateOne({
                name: tokens[token].name,
                symbol: tokens[token].symbol,
                mint: token,
                icon: tokens[token].icon,
                decimal: tokens[token].decimal,
                source: "raydium"
            }, {}, { upsert: true });
        }
        console.log("Get list of liquidity pools");
        const resp = yield axios_1.default.get("https://api.raydium.io/v2/sdk/liquidity/mainnet.json");
        const liquidityPools = yield resp.data;
        console.log(`Received official ${liquidityPools["official"].length} liquidity pools`);
        console.log(`Received unofficial ${liquidityPools["unOfficial"].length} liquidity pools`);
        for (let lp of liquidityPools["official"]) {
            console.log(`Save lpool ${lp.id}`);
            yield mongo_1.LPoolModel.updateOne({
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
            }, {}, { upsert: true });
            Object.keys(lp).map((key) => lp[key] = new web3_js_1.PublicKey(lp[key]));
            let poolInfo;
            try {
                console.log(`Get info for ${lp.id}`);
                poolInfo = yield raydium_sdk_1.Liquidity.fetchInfo({
                    connection: solanaConnection,
                    poolKeys: lp
                });
            }
            catch (e) {
                console.log(`Can't get pool info: ${e}`);
                continue;
            }
            if (poolInfo) {
                console.log(`Save info for ${lp.id}`);
                yield ch.insert(`INSERT INTO lpools (address, base, quote, liquidity, date)`, {
                    address: lp.id.toString(),
                    base: poolInfo.baseReserve.toString(),
                    quote: poolInfo.quoteReserve.toString(),
                    liquidity: poolInfo.lpSupply.toString(),
                    date: new Date()
                }).toPromise();
            }
        }
        for (let lp of liquidityPools["unOfficial"]) {
            yield mongo_1.LPoolModel.updateOne({
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
            }, {}, { upsert: true });
            Object.keys(lp).map((key) => lp[key] = new web3_js_1.PublicKey(lp[key]));
            let poolInfo;
            try {
                console.log(`Get info for ${lp.id}`);
                poolInfo = yield raydium_sdk_1.Liquidity.fetchInfo({
                    connection: solanaConnection,
                    poolKeys: lp
                });
            }
            catch (e) {
                console.log(`Can't get pool info: ${e}`);
                continue;
            }
            if (poolInfo) {
                console.log(`Save info for ${lp.id}`);
                yield ch.insert(`INSERT INTO lpools (address, base, quote, liquidity, date)`, {
                    address: lp.id.toString(),
                    base: poolInfo.baseReserve.toString(),
                    quote: poolInfo.quoteReserve.toString(),
                    liquidity: poolInfo.lpSupply.toString(),
                    date: new Date()
                }).toPromise();
            }
        }
        console.log(`Get list of farm pools`);
        const farms = yield getFarmPools();
        console.log(`Received ${farms.length} farm pools`);
        for (let farm of farms) {
            console.log(`Save farm ${farm.id}`);
            yield mongo_1.FarmModel.updateOne({
                id: farm.id.toString(),
                lpMint: farm.lpMint.toString(),
                programId: farm.programId.toString(),
                lpVault: farm.lpVault.toString(),
                rewardMints: farm.rewardMints.map((rewardMint) => rewardMint.toString()),
                rewardVaults: farm.rewardVaults.map((rewardVault) => rewardVault.toString()),
            }, {}, { upsert: true });
            let farmInfo = yield raydium_sdk_1.Farm.fetchMultipleInfo({
                connection: solanaConnection,
                pools: [farm],
            });
            if (farmInfo) {
                console.log(`Save info for farm ${farm.id}`);
                yield ch.insert(`INSERT INTO farms (address, rewards, amount, date)`, {
                    address: farm.id.toString(),
                    rewards: farmInfo[farm.id.toString()].state.totalRewards.map((reward) => reward.toString()),
                    amount: farmInfo[farm.id.toString()].lpVault.amount.toString(),
                    date: new Date()
                }).toPromise();
            }
        }
        yield ((_a = mongo.connection) === null || _a === void 0 ? void 0 : _a.close());
    });
}
processing();
