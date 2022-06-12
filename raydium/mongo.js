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
exports.FarmModel = exports.LPoolModel = exports.TokenModel = exports.tokenSchema = exports.makeMongo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema, SchemaTypes } = mongoose_1.default;
const tokenSchema = new Schema({
    name: SchemaTypes.String,
    symbol: SchemaTypes.String,
    mint: SchemaTypes.String,
    icon: SchemaTypes.String,
    decimal: SchemaTypes.Number,
    source: SchemaTypes.String,
});
exports.tokenSchema = tokenSchema;
const TokenModel = mongoose_1.default.model('Tokens', tokenSchema);
exports.TokenModel = TokenModel;
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
const LPoolModel = mongoose_1.default.model('LPools', lpoolSchema);
exports.LPoolModel = LPoolModel;
const farmSchema = new Schema({
    id: SchemaTypes.String,
    lpMint: SchemaTypes.String,
    programId: SchemaTypes.String,
    lpVault: SchemaTypes.String,
    rewardMints: [SchemaTypes.String],
    rewardVaults: [SchemaTypes.String],
});
const FarmModel = mongoose_1.default.model('Farms', farmSchema);
exports.FarmModel = FarmModel;
function makeMongo(url) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Create mongodb connection to ${url}`);
        return yield mongoose_1.default.connect(url);
    });
}
exports.makeMongo = makeMongo;
