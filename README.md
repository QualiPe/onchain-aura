## AI Web3 Influencer Monorepo

Yarn workspaces monorepo with:
- contracts: Hardhat + Solidity
- server: NestJS (TypeScript)
- client: React + Vite (TypeScript)
- shared: TypeScript shared types and hashing utilities

### Install

```bash
yarn install
```

### Develop

```bash
yarn dev
```

Runs server (http://localhost:3000) and client (http://localhost:5173) together.

### Build all

```bash
yarn build
```

### Test

```bash
yarn workspace contracts test
```

### Contracts

Compile:
```bash
yarn workspace contracts build
```

Run tests:
```bash
yarn workspace contracts test
```

Deploy:
```bash
yarn workspace contracts deploy
```

### Environment

Create `.env` files as needed and place real keys in your local environment. Suggested root `.env.example` contents:

```
# CDP
CDP_API_KEY=
CDP_WALLET_ID=
X402_RECEIVER=

# Symbiotic Relay
RELAY_URL=
RELAY_KEYTAG=1

# IPFS / Filecoin
IPFS_ENDPOINT=
IPFS_TOKEN=

# Chains
RPC_URL_BASE=
CHAIN_ID_BASE=84532
INFLUENCER_FEED_ADDRESS=
```

### Pipeline (high level)

Graph -> LLM -> Symbiotic -> IPFS/Filecoin -> CDP tx

Implemented as stubs in `server/src/pipeline/pipeline.service.ts` calling integration services in order.

### Docker

Use docker-compose for dev:
```bash
docker-compose up --build
```

# onchain-aura-