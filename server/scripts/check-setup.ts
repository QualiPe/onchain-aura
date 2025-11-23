import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
const envLocalPath = path.join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

console.log('🔍 Checking test setup...\n');

const checks = {
  'TEST_PRIVATE_KEY': process.env.TEST_PRIVATE_KEY,
  'CDP_API_KEY_ID': process.env.CDP_API_KEY_ID,
  'CDP_API_KEY_SECRET': process.env.CDP_API_KEY_SECRET,
  'CDP_WALLET_SECRET': process.env.CDP_WALLET_SECRET,
  'RPC_URL_BASE': process.env.RPC_URL_BASE || 'https://sepolia.base.org (default)',
  'SERVER_URL': process.env.SERVER_URL || 'http://localhost:3000 (default)',
};

let allGood = true;

for (const [key, value] of Object.entries(checks)) {
  const status = value ? '✅' : '❌';
  const displayValue = value ? `${value.substring(0, 10)}...` : 'NOT SET';
  console.log(`${status} ${key}: ${displayValue}`);
  if (!value && key.startsWith('TEST_') || key.startsWith('CDP_')) {
    allGood = false;
  }
}

console.log('\n' + '='.repeat(60));

if (allGood) {
  console.log('✅ All required environment variables are set!');
  console.log('\nNext steps:');
  console.log('1. Make sure the server is running: yarn workspace server start:dev');
  console.log('2. Run the test: yarn workspace server test:donation');
} else {
  console.log('❌ Some required environment variables are missing.');
  console.log('\nPlease set the following in your .env.local file:');
  if (!checks.TEST_PRIVATE_KEY) {
    console.log('  TEST_PRIVATE_KEY=0x... # Private key of wallet with testnet ETH');
  }
  if (!checks.CDP_API_KEY_ID) {
    console.log('  CDP_API_KEY_ID=... # From CDP Portal');
  }
  if (!checks.CDP_API_KEY_SECRET) {
    console.log('  CDP_API_KEY_SECRET=... # From CDP Portal');
  }
  if (!checks.CDP_WALLET_SECRET) {
    console.log('  CDP_WALLET_SECRET=... # From CDP Portal');
  }
  console.log('\nGet testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet');
}

process.exit(allGood ? 0 : 1);

