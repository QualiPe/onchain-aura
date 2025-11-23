# Testing Guide

## Testing Donation Reception

### Quick Start

1. **Start the server:**
   ```bash
   yarn workspace server start:dev
   ```

2. **Set up test environment:**
   Create a `.env.local` file in the root directory with:
   ```env
   TEST_PRIVATE_KEY=0x... # Your test wallet private key (must have Base Sepolia ETH)
   SERVER_URL=http://localhost:3000
   RPC_URL_BASE=https://sepolia.base.org
   ```

3. **Get testnet ETH:**
   - Visit: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - Request testnet ETH for your test wallet

4. **Run the test:**
   ```bash
   cd server
   yarn test:donation
   ```

### What the Test Does

The test script (`server/scripts/test-donation.ts`) will:

1. ✅ Connect to your running server
2. ✅ Get the agent wallet address
3. ✅ Send a test transaction with a message
4. ✅ Wait for transaction confirmation
5. ✅ Trigger donation monitoring
6. ✅ Verify the donation was received
7. ✅ Verify the message was extracted correctly

### Expected Results

If everything works correctly, you should see:

```
✅ TEST PASSED: Donation with message was received and processed correctly!
```

### Troubleshooting

**"Cannot connect to server"**
- Make sure the server is running on port 3000
- Check `SERVER_URL` environment variable

**"TEST_PRIVATE_KEY environment variable is required"**
- Add `TEST_PRIVATE_KEY` to your `.env.local` file
- Make sure the wallet has testnet ETH

**"Donation not found"**
- Check server logs for errors
- Try manually calling `POST /donations/monitor`
- Verify the transaction was sent (check on BaseScan)

**"Message mismatch"**
- The message encoding might need adjustment
- Check the `x402-parser.ts` implementation
- Verify transaction data contains the message

### Manual Testing

You can also test manually:

1. **Get agent wallet address:**
   ```bash
   curl http://localhost:3000/wallet/address
   ```

2. **Send a transaction** using MetaMask or another wallet:
   - To: Agent wallet address
   - Amount: Any amount
   - Data: Your message (hex-encoded)

3. **Check donations:**
   ```bash
   curl http://localhost:3000/donations
   ```

4. **Trigger manual check:**
   ```bash
   curl -X POST http://localhost:3000/donations/monitor
   ```

### Test Script Options

The test script accepts these environment variables:

- `TEST_PRIVATE_KEY` (required): Private key of wallet with testnet ETH
- `SERVER_URL` (optional): Server URL, defaults to `http://localhost:3000`
- `RPC_URL_BASE` (optional): RPC URL, defaults to `https://sepolia.base.org`

### Next Steps

After successful testing:
- ✅ Donation reception works
- ✅ Message extraction works
- ✅ Weight calculation works
- 🚧 Ready to implement LLM content generation
- 🚧 Ready to implement Symbiotic attestation

