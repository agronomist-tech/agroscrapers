import mongoose from 'mongoose';
const { Schema, SchemaTypes } = mongoose;


const tokenSchema = new Schema({
    name: SchemaTypes.String,
    symbol: SchemaTypes.String,
    mint: SchemaTypes.String,
    icon: SchemaTypes.String,
    decimal: SchemaTypes.Number,
    source: SchemaTypes.String,
});

const TokenModel = mongoose.model('Tokens', tokenSchema);


const lpoolSchema = new Schema({
    id: SchemaTypes.String,
    lpMint: SchemaTypes.String,
    baseMint: SchemaTypes.String,
    quoteMint: SchemaTypes.String,
    lpDecimal: SchemaTypes.Number,
    baseDecimal: SchemaTypes.Number,
    quoteDecimal: SchemaTypes.Number,
    lpVault: SchemaTypes.String,
    programId: SchemaTypes.String,
    baseVault: SchemaTypes.String,
    quoteVault: SchemaTypes.String,
    comment: SchemaTypes.String,
});

const LPoolModel = mongoose.model('LPools', lpoolSchema);


const farmSchema = new Schema({
    id: SchemaTypes.String,
    lpMint: SchemaTypes.String,
    programId: SchemaTypes.String,
    lpVault: SchemaTypes.String,
    rewardMints: [SchemaTypes.String],
    rewardVaults: [SchemaTypes.String],
});

const FarmModel = mongoose.model('Farms', farmSchema);


async function makeMongo(url: string) {
    console.log(`Create mongodb connection to ${url}`);
    return await mongoose.connect(url);
}


export {makeMongo, tokenSchema, TokenModel, LPoolModel, FarmModel};