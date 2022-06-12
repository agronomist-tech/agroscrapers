import {Connection, PublicKey} from "@solana/web3.js";
import {
    Farm,
    FarmPoolKeys,
    SplTokenJsonInfo,
    FarmPoolsJsonFile,
    LiquidityPoolJsonInfo,
    LiquidityPoolKeys,
    Liquidity,
    FarmPoolJsonInfo, LiquidityPoolInfo, Token
} from "@raydium-io/raydium-sdk";
import axios from "axios";
import {makeClickhouse} from "./ch";
import {makeMongo, TokenModel, LPoolModel, FarmModel} from "./mongo";


const config = {
    solanaUrl: process.env.SOLANA_URL || "https://solana-api.projectserum.com",
    mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/agronomist",
    clickhouseHost: process.env.CLICKHOUSE_HOST || "localhost",
    clickhousePort: process.env.CLICKHOUSE_PORT ? parseInt(process.env.CLICKHOUSE_PORT) : 9000,
    clickhouseDatabase: process.env.CLICKHOUSE_DATABASE || "agronomist",
}

const solanaConnection = new Connection(config.solanaUrl);


type Tokens = {
    [key: string]: { [key: string]: string | number }
}


async function getTokens(): Promise<Tokens> {
    const resp = await axios.get("https://api.raydium.io/v2/sdk/token/raydium.mainnet.json");
    const tokensList = await resp.data;
    let tokens: { [key: string]: { [key: string]: string | number } } = {};

    tokensList["official"].map((token: SplTokenJsonInfo) => {
        tokens[token.mint] = {
            "name": token.name,
            "symbol": token.symbol,
            // @ts-ignore
            "icon": token.icon,
            "decimal": token.decimals
        }
    });

    tokensList["unOfficial"].map((token: SplTokenJsonInfo) => {
        tokens[token.mint] = {
            "name": token.name,
            "symbol": token.symbol,
            // @ts-ignore
            "icon": token.icon,
            "decimal": token.decimals
        }
    })

    return tokens
}


async function getFarmPools(): Promise<FarmPoolKeys[]> {
    const resp = await axios.get("https://api.raydium.io/v2/sdk/farm/mainnet.json");
    const pools = await resp.data as FarmPoolsJsonFile;

    return pools.official.map((pool: FarmPoolJsonInfo) => {
        return {
            "id": new PublicKey(pool.id),
            "lpMint": new PublicKey(pool.lpMint),
            "rewardMints": pool.rewardMints.map((rewardMint: string) => new PublicKey(rewardMint)),
            "version": pool.version,
            "programId": new PublicKey(pool.programId),
            "authority": new PublicKey(pool.authority),
            "lpVault": new PublicKey(pool.lpVault),
            "rewardVaults": pool.rewardVaults.map((rewardVault: string) => new PublicKey(rewardVault)),
        }
    })
}


async function processing() {
    const mongo = await makeMongo(config.mongoUrl);
    const ch = await makeClickhouse(config.clickhouseHost, config.clickhousePort, config.clickhouseDatabase);

    console.log("Get tokens from raydium");
    const tokens = await getTokens();
    console.log(`Received ${tokens.length} tokens`);
    for (let token in tokens) {
        await TokenModel.updateOne( {
            name: tokens[token].name,
            symbol: tokens[token].symbol,
            mint: token,
            icon: tokens[token].icon,
            decimal: tokens[token].decimal,
            source: "raydium"
        }, {},{upsert: true})
    }

    console.log("Get list of liquidity pools");
    const resp = await axios.get("https://api.raydium.io/v2/sdk/liquidity/mainnet.json");

    const liquidityPools = await resp.data;
    console.log(`Received official ${liquidityPools["official"].length} liquidity pools`);
    console.log(`Received unofficial ${liquidityPools["unOfficial"].length} liquidity pools`);

    for (let lp of liquidityPools["official"]) {
        console.log(`Save lpool ${lp.id}`)
        await LPoolModel.updateOne( {
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
        }, {}, {upsert: true})

        Object.keys(lp).map((key: string) => lp[key] = new PublicKey(lp[key]));
        let poolInfo;
        try {
            console.log(`Get info for ${lp.id}`);
            poolInfo = await Liquidity.fetchInfo(
            {
                connection: solanaConnection,
                poolKeys: lp
            }
        );
        } catch (e) {
            console.log(`Can't get pool info: ${e}`)
            continue
        }

        if (poolInfo) {
            console.log(`Save info for ${lp.id}`)
            await ch.insert(`INSERT INTO lpools (address, base, quote, liquidity, date)`, {
                address: lp.id.toString(),
                base: poolInfo.baseReserve.toString(),
                quote: poolInfo.quoteReserve.toString(),
                liquidity: poolInfo.lpSupply.toString(),
                date: new Date()
            }).toPromise();
        }
    }

    for (let lp of liquidityPools["unOfficial"]) {
        await LPoolModel.updateOne( {
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
        }, {}, {upsert: true})
        Object.keys(lp).map((key: string) => lp[key] = new PublicKey(lp[key]));
        let poolInfo;
        try {
            console.log(`Get info for ${lp.id}`);
            poolInfo = await Liquidity.fetchInfo(
            {
                connection: solanaConnection,
                poolKeys: lp
            }
        );
        } catch (e) {
            console.log(`Can't get pool info: ${e}`)
            continue
        }

        if (poolInfo) {
            console.log(`Save info for ${lp.id}`)
            await ch.insert(`INSERT INTO lpools (address, base, quote, liquidity, date)`, {
                address: lp.id.toString(),
                base: poolInfo.baseReserve.toString(),
                quote: poolInfo.quoteReserve.toString(),
                liquidity: poolInfo.lpSupply.toString(),
                date: new Date()
            }).toPromise();
        }
    }
    console.log(`Get list of farm pools`);
    const farms = await getFarmPools();
    console.log(`Received ${farms.length} farm pools`);
    for (let farm of farms) {
        console.log(`Save farm ${farm.id}`)
        await FarmModel.updateOne( {
            id: farm.id.toString(),
            lpMint: farm.lpMint.toString(),
            programId: farm.programId.toString(),
            lpVault: farm.lpVault.toString(),
            rewardMints: farm.rewardMints.map((rewardMint: PublicKey) => rewardMint.toString()),
            rewardVaults: farm.rewardVaults.map((rewardVault: PublicKey) => rewardVault.toString()),
        }, {}, {upsert: true});

        let farmInfo = await Farm.fetchMultipleInfo({
            connection: solanaConnection,
            pools: [farm],
        });

        if (farmInfo) {
            console.log(`Save info for farm ${farm.id}`)
             await ch.insert(`INSERT INTO farms (address, rewards, amount, date)`, {
                address: farm.id.toString(),
                rewards: farmInfo[farm.id.toString()].state.totalRewards.map((reward: PublicKey) => reward.toString()),
                amount: farmInfo[farm.id.toString()].lpVault.amount.toString(),
                date: new Date()
            }).toPromise();
        }
    }

    await mongo.connection?.close()
}


processing();
