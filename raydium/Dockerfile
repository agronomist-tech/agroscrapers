FROM node:16-alpine

RUN npm install

ENV SOLANA_URL=https://solana-api.projectserum.com
ENV MONGO_URL=mongodb://mongo:27017/db
ENV CLICKHOUSE_HOST=clickhouse
ENV CLICKHOUSE_PORT=9000
ENV CLICKHOUSE_DATABASE=db

COPY . /opt/raydium

WORKDIR /opt/raydium

CMD ["node", "index.js"]
