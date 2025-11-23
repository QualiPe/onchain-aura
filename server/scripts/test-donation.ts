import { createWalletClient, createPublicClient, http, parseEther, stringToHex } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
const envLocalPath = path.join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const RPC_URL = process.env.RPC_URL_BASE || 'https://sepolia.base.org';
const TEST_PRIVATE_KEY = process.env.TEST_PRIVATE_KEY;

if (!TEST_PRIVATE_KEY) {
  console.error('❌ ERROR: TEST_PRIVATE_KEY environment variable is required');
  console.error('\nPlease set TEST_PRIVATE_KEY in your .env file:');
  console.error('  TEST_PRIVATE_KEY=0x...');
  console.error('\nThis should be a private key for a wallet with testnet ETH on Base Sepolia.');
  process.exit(1);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAgentWalletAddress(): Promise<string> {
  try {
    const response = await fetch(`${SERVER_URL}/wallet/address`);
    if (!response.ok) {
      throw new Error(`Failed to get wallet address: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.address) {
      throw new Error('Invalid response: address not found');
    }
    return data.address;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to server at ${SERVER_URL}. Is the server running?`);
    }
    throw error;
  }
}

async function sendDonationWithMessage(
  to: string,
  amount: string,
  message: string,
): Promise<string> {
  const account = privateKeyToAccount(TEST_PRIVATE_KEY as `0x${string}`);
  
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(RPC_URL),
  });

  console.log(`\n📤 Sending donation:`);
  console.log(`   From: ${account.address}`);
  console.log(`   To: ${to}`);
  console.log(`   Amount: ${amount} ETH`);
  console.log(`   Message: "${message}"`);

  // Encode message as transaction data
  // Option 1: Simple hex encoding of the message
  const messageHex = stringToHex(message, { size: 0 });
  
  // Option 2: X402-like format with function selector (optional)
  // For testing, we'll use simple hex encoding
  const data = messageHex;

  const hash = await walletClient.sendTransaction({
    to: to as `0x${string}`,
    value: parseEther(amount),
    data: data as `0x${string}`,
  });

  console.log(`   Transaction hash: ${hash}`);
  console.log(`   Waiting for confirmation...`);

  // Wait for transaction confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);

  return hash;
}

async function checkDonationReceived(txHash: string, expectedMessage: string): Promise<boolean> {
  console.log(`\n🔍 Checking if donation was received...`);
  
  let attempts = 0;
  const maxAttempts = 20; // Check for up to 60 seconds (20 * 3s)
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${SERVER_URL}/donations/${txHash}`);
      
      if (response.ok) {
        const donation = await response.json();
        
        console.log(`   ✅ Donation found!`);
        console.log(`   Transaction: ${donation.transactionHash}`);
        console.log(`   Amount: ${donation.valueEth} ETH`);
        console.log(`   From: ${donation.from}`);
        console.log(`   Message: "${donation.message || '(no message)'}"`);
        console.log(`   Weight: ${donation.messageWeight.toFixed(2)}`);
        
        // Verify message matches
        if (donation.message === expectedMessage) {
          console.log(`   ✅ Message matches expected value!`);
          return true;
        } else {
          console.log(`   ⚠️  Message mismatch:`);
          console.log(`      Expected: "${expectedMessage}"`);
          console.log(`      Got: "${donation.message}"`);
          return false;
        }
      } else if (response.status === 404) {
        // Donation not found yet, wait and retry
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`   ⏳ Donation not found yet, retrying in 3 seconds... (${attempts}/${maxAttempts})`);
          await sleep(3000);
        }
      } else {
        throw new Error(`Unexpected response: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`   ❌ Error checking donation:`, error);
      attempts++;
      if (attempts < maxAttempts) {
        await sleep(3000);
      }
    }
  }
  
  console.log(`   ❌ Donation not found after ${maxAttempts} attempts`);
  return false;
}

async function triggerManualCheck(): Promise<void> {
  console.log(`\n🔄 Triggering manual donation check...`);
  try {
    const response = await fetch(`${SERVER_URL}/donations/monitor`, {
      method: 'POST',
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Check completed: ${result.count} new donation(s) found`);
    } else {
      console.log(`   ⚠️  Check request returned: ${response.status}`);
    }
  } catch (error) {
    console.error(`   ❌ Error triggering check:`, error);
  }
}

async function main() {
  console.log('🧪 Testing Donation Reception with Message\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get agent wallet address
    console.log('\n📋 Step 1: Getting agent wallet address...');
    const agentAddress = await getAgentWalletAddress();
    console.log(`   Agent wallet: ${agentAddress}`);

    // Step 2: Send donation with message
    console.log('\n📋 Step 2: Sending donation with message...');
    const testMessage = `Test donation message at ${new Date().toISOString()}`;
    const testAmount = '0.0001'; // Small test amount
    const txHash = await sendDonationWithMessage(agentAddress, testAmount, testMessage);

    // Step 3: Trigger manual check (in case automatic monitoring hasn't run yet)
    await triggerManualCheck();

    // Step 4: Wait a bit for processing
    console.log('\n⏳ Waiting 5 seconds for processing...');
    await sleep(5000);

    // Step 5: Verify donation was received
    console.log('\n📋 Step 3: Verifying donation was received...');
    const success = await checkDonationReceived(txHash, testMessage);

    // Summary
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ TEST PASSED: Donation with message was received and processed correctly!');
      process.exit(0);
    } else {
      console.log('❌ TEST FAILED: Donation was not received or message mismatch');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    process.exit(1);
  }
}

main();

