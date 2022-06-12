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
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareCHTables = exports.makeClickhouse = void 0;
const clickhouse_1 = require("clickhouse");
function makeClickhouse(host, port, database) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Create clickhouse connection to ${host}:${port}/${database}`);
        const conn = new clickhouse_1.ClickHouse({
            url: host,
            port: port,
            config: {
                database: database
            }
        });
        console.log("Prepare tables");
        yield prepareCHTables(conn);
        return conn;
    });
}
exports.makeClickhouse = makeClickhouse;
function prepareCHTables(conn) {
    return __awaiter(this, void 0, void 0, function* () {
        yield conn.query(`CREATE TABLE IF NOT EXISTS lpools
                            (
                                address String,
                                base String,
                                quote String,
                                liquidity String,
                                date DateTime      
                            ) 
                            ENGINE=MergeTree()
                            ORDER BY date
    `).toPromise();
        yield conn.query(`CREATE TABLE IF NOT EXISTS farms
                            (
                                address String,
                                rewards Array(String),
                                amount String,
                                date DateTime
                            ) 
                            ENGINE=MergeTree()
                            ORDER BY date
    `).toPromise();
    });
}
exports.prepareCHTables = prepareCHTables;
