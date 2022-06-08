import {ClickHouse} from "clickhouse";

async function makeClickhouse(host: string, port: number, database: string) {
    console.log("Create connection");
    const conn = new ClickHouse({
        url: host,
        port: port,
        config: {
            database: database
        }
    });
    console.log("Prepare tables");
    await prepareCHTables(conn);
    return conn;
}


async function prepareCHTables(conn: ClickHouse) {
    await conn.query(`CREATE TABLE IF NOT EXISTS lpools
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

    await conn.query(`CREATE TABLE IF NOT EXISTS farms
                            (
                                address String,
                                rewards Array(String),
                                amount String,
                                date DateTime
                            ) 
                            ENGINE=MergeTree()
                            ORDER BY date
    `).toPromise();
}


export {makeClickhouse, prepareCHTables}