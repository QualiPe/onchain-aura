# Development Plan: AI Web3 Influencer Agent with CDP

## Overview

This project implements an autonomous AI agent that:
1. **Securely owns a wallet** using CDP Server Wallets v2
2. **Receives donations with messages** from users
3. **Generates content** based on message weight using a prepared LLM algorithm
4. **Creates attestation proofs** for generated content using Symbiotic.fi

## Architecture

```
┌─────────────────┐
│  Donation Tx    │ (with message)
│  (X402/Standard)│
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  Wallet Monitor │ (CDP Server Wallet)
│  & Message      │
│  Extraction     │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  LLM Service    │ (Content Generation)
│  (Weight-based) │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  Symbiotic.fi   │ (Attestation)
│  Attestation    │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  IPFS/Filecoin  │ (Content Storage)
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  CDP Transaction│ (Onchain Record)
└─────────────────┘
```

## Implementation Modules

### 1. CDP Wallet Service (`server/src/wallet/`)

**Purpose**: Manage the agent's secure wallet using CDP Server Wallets v2

**Key Features**:
- Create and initialize agent wallet on startup
- Monitor incoming transactions
- Extract messages from transaction data (X402 protocol or transaction input data)
- Get wallet balance and transaction history

**Dependencies**:
- `@coinbase/cdp-sdk` - CDP SDK for wallet operations
- Environment: `CDP_API_KEY`, `CDP_WALLET_SECRET`

**Files**:
- `wallet.module.ts` - NestJS module
- `wallet.service.ts` - Core wallet operations
- `wallet.controller.ts` - API endpoints (optional, for admin)
- `wallet.types.ts` - Type definitions

### 2. Donation Service (`server/src/donation/`)

**Purpose**: Handle donation reception and message extraction

**Key Features**:
- Listen for incoming transactions to agent wallet
- Parse X402 protocol messages or transaction input data
- Store donation records with messages
- Calculate message weight/priority

**Message Extraction**:
- X402 Protocol: Check for X402-compliant transaction data
- Standard: Extract from transaction input data or memo fields
- Event Logs: Monitor smart contract events if using a donation contract

**Files**:
- `donation.module.ts`
- `donation.service.ts`
- `donation.controller.ts` - Webhook endpoints
- `donation.types.ts`
- `x402-parser.ts` - X402 message parsing utility

### 3. LLM Content Service (`server/src/llm/`)

**Purpose**: Generate content based on message weight

**Key Features**:
- Integrate prepared LLM algorithm
- Process messages with weight calculation
- Generate content (text, video plan, etc.)
- Return structured content payload

**Integration**:
- Use existing `Signal`, `VideoPlan`, `PostPayload` types from `shared`
- Weight calculation based on donation amount, message content, etc.

**Files**:
- `llm.module.ts`
- `llm.service.ts`
- `llm.controller.ts` - Trigger generation manually
- `weight-calculator.ts` - Message weight calculation logic

### 4. Symbiotic Attestation Service (`server/src/attestation/`)

**Purpose**: Create attestation proofs for generated content

**Key Features**:
- Generate attestation proofs via Symbiotic.fi API
- Link attestations to content hashes
- Store attestation records

**Integration**:
- Symbiotic.fi Relay API
- Environment: `RELAY_URL`, `RELAY_KEYTAG`

**Files**:
- `attestation.module.ts`
- `attestation.service.ts`
- `symbiotic-client.ts` - Symbiotic.fi API client
- `attestation.types.ts`

### 5. IPFS Service (`server/src/storage/`)

**Purpose**: Store generated content on IPFS/Filecoin

**Key Features**:
- Upload content to IPFS
- Store video plans and generated content
- Return CIDs for onchain storage

**Integration**:
- IPFS API (Pinata, Infura, or self-hosted)
- Environment: `IPFS_ENDPOINT`, `IPFS_TOKEN`

**Files**:
- `storage.module.ts`
- `storage.service.ts`
- `ipfs-client.ts`

### 6. Pipeline Service (`server/src/pipeline/`)

**Purpose**: Orchestrate the entire flow

**Key Features**:
- Chain services in order: donation → LLM → attestation → IPFS → CDP tx
- Error handling and retry logic
- Transaction status tracking

**Flow**:
1. Detect new donation with message
2. Extract message and calculate weight
3. Generate content via LLM
4. Create attestation proof
5. Upload to IPFS
6. Submit onchain transaction via CDP

**Files**:
- `pipeline.module.ts`
- `pipeline.service.ts`
- `pipeline.types.ts`

### 7. Transaction Monitor (`server/src/monitor/`)

**Purpose**: Monitor blockchain for incoming transactions

**Key Features**:
- Poll CDP wallet for new transactions
- Or use webhooks if available
- Trigger pipeline on new donations

**Files**:
- `monitor.module.ts`
- `monitor.service.ts`
- `monitor.scheduler.ts` - Scheduled polling

## Data Flow

### 1. Donation Reception
```
User sends donation → Transaction to agent wallet → Monitor detects → Extract message
```

### 2. Content Generation
```
Message + Weight → LLM Service → Generated Content (PostPayload)
```

### 3. Attestation
```
Content Hash → Symbiotic.fi → Attestation Proof
```

### 4. Storage & Onchain
```
Content → IPFS → CID → CDP Transaction → Onchain Record
```

## Environment Variables

```env
# CDP Configuration
CDP_API_KEY=your_api_key
CDP_WALLET_SECRET=your_wallet_secret
CDP_WALLET_ID=wallet_id_after_creation

# X402 / Donation Receiver
X402_RECEIVER=agent_wallet_address

# Symbiotic.fi
RELAY_URL=https://relay.symbiotic.fi
RELAY_KEYTAG=1

# IPFS / Filecoin
IPFS_ENDPOINT=https://ipfs.infura.io:5001
IPFS_TOKEN=your_ipfs_token

# Blockchain
RPC_URL_BASE=https://base-sepolia.g.alchemy.com/v2/your_key
CHAIN_ID_BASE=84532

# LLM (if external API)
LLM_API_KEY=optional
LLM_ENDPOINT=optional
```

## API Endpoints

### Admin/Management
- `GET /wallet/address` - Get agent wallet address
- `GET /wallet/balance` - Get wallet balance
- `GET /donations` - List all donations
- `GET /donations/:id` - Get donation details
- `POST /pipeline/trigger` - Manually trigger pipeline

### Webhooks
- `POST /webhooks/donation` - CDP webhook for new transactions (if available)

## Implementation Order

1. **Phase 1: Wallet Setup**
   - Install CDP SDK
   - Create wallet service
   - Initialize agent wallet on startup
   - Test wallet creation and basic operations

2. **Phase 2: Donation Reception**
   - Implement transaction monitoring
   - Add message extraction (X402 or standard)
   - Store donation records

3. **Phase 3: LLM Integration**
   - Integrate prepared LLM algorithm
   - Implement weight calculation
   - Test content generation

4. **Phase 4: Attestation**
   - Integrate Symbiotic.fi
   - Create attestation service
   - Test attestation generation

5. **Phase 5: Storage & Pipeline**
   - Add IPFS integration
   - Build pipeline orchestration
   - End-to-end testing

6. **Phase 6: API & Monitoring**
   - Create API endpoints
   - Add monitoring and logging
   - Error handling and retries

## Dependencies to Install

```json
{
  "@coinbase/cdp-sdk": "^latest",
  "viem": "^2.0.0",
  "ethers": "^6.0.0", // if needed for additional blockchain operations
  "@nestjs/schedule": "^4.0.0", // for transaction polling
  "ipfs-http-client": "^60.0.0", // for IPFS
  "axios": "^1.6.0" // for HTTP clients
}
```

## Testing Strategy

1. **Unit Tests**: Each service module
2. **Integration Tests**: Service interactions
3. **E2E Tests**: Full pipeline flow
4. **Manual Tests**: On testnet (Base Sepolia)

## Security Considerations

1. **Wallet Security**: CDP handles private keys securely
2. **API Keys**: Store in environment variables, never commit
3. **Message Validation**: Validate and sanitize incoming messages
4. **Rate Limiting**: Implement for API endpoints
5. **Error Handling**: Don't expose sensitive information in errors

## Next Steps

1. Review and approve this plan
2. Set up CDP account and get API keys
3. Start with Phase 1: Wallet Setup
4. Iterate through phases with testing at each step

