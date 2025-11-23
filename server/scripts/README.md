# Test Scripts

## test-donation.ts

Tests the donation reception system by:
1. Getting the agent wallet address from the server
2. Sending a test transaction with a message
3. Verifying the donation is received and processed correctly

### Prerequisites

1. **Server must be running** on `http://localhost:3000` (or set `SERVER_URL` env var)

2. **Environment variables** (in `.env` or `.env.local`):
   ```env
   # Test sender wallet (must have funds on Base Sepolia)
   TEST_PRIVATE_KEY=0x...

   # Server URL (optional, defaults to http://localhost:3000)
   SERVER_URL=http://localhost:3000

   # RPC URL (optional, defaults to https://sepolia.base.org)
   RPC_URL_BASE=https://sepolia.base.org
   ```

3. **Test wallet must have ETH** on Base Sepolia testnet
   - You can get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Running the Test

```bash
# From the server directory
yarn test:donation

# Or using ts-node directly
ts-node scripts/test-donation.ts
```

### What the Test Does

1. **Gets Agent Wallet**: Fetches the agent wallet address from `/wallet/address`
2. **Sends Donation**: Creates a transaction with:
   - Recipient: Agent wallet address
   - Amount: 0.0001 ETH (configurable)
   - Message: Encoded in transaction data
3. **Waits for Confirmation**: Waits for transaction to be mined
4. **Triggers Check**: Calls `/donations/monitor` to manually trigger donation detection
5. **Verifies Reception**: Polls `/donations/:txHash` to verify:
   - Donation was received
   - Message was extracted correctly
   - Weight was calculated

### Expected Output

```
🧪 Testing Donation Reception with Message
============================================================

📋 Step 1: Getting agent wallet address...
   Agent wallet: 0x...

📤 Sending donation:
   From: 0x...
   To: 0x...
   Amount: 0.0001 ETH
   Message: "Test donation message at 2024-..."
   Transaction hash: 0x...
   Waiting for confirmation...
   ✅ Transaction confirmed in block 12345

🔄 Triggering manual donation check...
   ✅ Check completed: 1 new donation(s) found

⏳ Waiting 5 seconds for processing...

📋 Step 3: Verifying donation was received...
🔍 Checking if donation was received...
   ✅ Donation found!
   Transaction: 0x...
   Amount: 0.0001 ETH
   From: 0x...
   Message: "Test donation message at 2024-..."
   Weight: 1.23
   ✅ Message matches expected value!

============================================================
✅ TEST PASSED: Donation with message was received and processed correctly!
```

### Troubleshooting

**Test fails with "Donation not found"**:
- Make sure the server is running
- Check that the monitor service is working (check server logs)
- Try manually calling `POST /donations/monitor` via curl/Postman
- Verify the transaction was actually sent (check on BaseScan)

**Message extraction fails**:
- The message is encoded as hex in transaction data
- Check the `x402-parser.ts` implementation
- Verify transaction data contains the message

**Server connection error**:
- Ensure server is running on the correct port
- Check `SERVER_URL` environment variable
- Verify CORS is configured if testing from different origin

