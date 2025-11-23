import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CdpClient } from '@coinbase/cdp-sdk';
import { toAccount } from 'viem/accounts';
import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { WalletInfo, TransactionInfo } from './wallet.types';

@Injectable()
export class WalletService implements OnModuleInit {
  private readonly logger = new Logger(WalletService.name);
  private cdp: CdpClient;
  private walletInfo: WalletInfo | null = null;
  private account: ReturnType<typeof toAccount> | null = null;
  private publicClient: ReturnType<typeof createPublicClient> | null = null;

  constructor(private configService: ConfigService) {
    // Initialize CDP client from environment variables
    this.cdp = new CdpClient();
    
    // Initialize public client for balance queries
    const rpcUrl = this.configService.get<string>('RPC_URL_BASE');
    
    // Use Base Sepolia by default, or custom RPC if provided
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    }) as any; // Type assertion to avoid complex viem type issues
  }

  async onModuleInit() {
    await this.initializeWallet();
  }

  /**
   * Initialize or retrieve the agent wallet
   * Creates a new wallet if CDP_WALLET_ID is not set, or retrieves existing one by name
   */
  async initializeWallet(): Promise<WalletInfo> {
    try {
      const walletName = this.configService.get<string>('CDP_WALLET_NAME', 'agent-wallet');
      const existingWalletId = this.configService.get<string>('CDP_WALLET_ID');
      
      // Try to get existing account by name first
      try {
        const existingAccount = await this.cdp.evm.getAccount({ name: walletName });
        if (existingAccount) {
          this.logger.log(`Found existing wallet by name: ${walletName}`);
          this.account = toAccount(existingAccount);
          this.walletInfo = {
            address: existingAccount.address,
            accountId: existingAccount.address, // Use address as ID since id property doesn't exist
            network: this.configService.get<string>('CHAIN_ID_BASE') === '84532' ? 'base-sepolia' : 'base',
          };
          this.logger.log(`Agent wallet loaded: ${this.walletInfo.address}`);
          return this.walletInfo;
        }
      } catch (error) {
        // Account not found by name, will create new one
        this.logger.log(`Account not found by name "${walletName}", creating new account...`);
      }

      // If CDP_WALLET_ID is provided, try to get by address
      if (existingWalletId) {
        try {
          const accountByAddress = await this.cdp.evm.getAccount({ address: existingWalletId as `0x${string}` });
          if (accountByAddress) {
            this.logger.log(`Found existing wallet by address: ${existingWalletId}`);
            this.account = toAccount(accountByAddress);
            this.walletInfo = {
              address: accountByAddress.address,
              accountId: accountByAddress.address, // Use address as ID since id property doesn't exist
              network: this.configService.get<string>('CHAIN_ID_BASE') === '84532' ? 'base-sepolia' : 'base',
            };
            this.logger.log(`Agent wallet loaded: ${this.walletInfo.address}`);
            return this.walletInfo;
          }
        } catch (error) {
          this.logger.warn(`Could not retrieve wallet by address ${existingWalletId}, creating new account...`);
        }
      }

      // Create a new EVM account (wallet) with a name
      this.logger.log(`Creating new EVM account with name: ${walletName}...`);
      const cdpAccount = await this.cdp.evm.createAccount({ name: walletName });
      
      this.account = toAccount(cdpAccount);
      
      this.walletInfo = {
        address: cdpAccount.address,
        accountId: cdpAccount.address, // Use address as ID since id property doesn't exist
        network: this.configService.get<string>('CHAIN_ID_BASE') === '84532' ? 'base-sepolia' : 'base',
      };

      this.logger.log(`Agent wallet initialized: ${this.walletInfo.address}`);
      this.logger.warn(
        `Save this wallet address to CDP_WALLET_ID in your .env file: ${this.walletInfo.address}`,
      );

      return this.walletInfo;
    } catch (error) {
      this.logger.error('Failed to initialize wallet:', error);
      throw error;
    }
  }

  /**
   * Get the agent wallet address
   */
  getWalletAddress(): string {
    if (!this.walletInfo) {
      throw new Error('Wallet not initialized');
    }
    return this.walletInfo.address;
  }

  /**
   * Get wallet information
   */
  getWalletInfo(): WalletInfo {
    if (!this.walletInfo) {
      throw new Error('Wallet not initialized');
    }
    return this.walletInfo;
  }

  /**
   * Get the CDP account for viem operations
   */
  getAccount() {
    if (!this.account) {
      throw new Error('Account not initialized');
    }
    return this.account;
  }

  /**
   * Get the CDP client instance
   */
  getCdpClient(): CdpClient {
    return this.cdp;
  }

  /**
   * Get wallet balance in ETH
   */
  async getBalance(): Promise<string> {
    if (!this.walletInfo || !this.publicClient) {
      throw new Error('Wallet not initialized');
    }

    try {
      const balance = await this.publicClient.getBalance({
        address: this.walletInfo.address as `0x${string}`,
      });
      return formatEther(balance);
    } catch (error) {
      this.logger.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get token balances for the wallet
   */
  async getTokenBalances(): Promise<any> {
    if (!this.walletInfo) {
      throw new Error('Wallet not initialized');
    }

    try {
      const balances = await this.cdp.evm.listTokenBalances({
        address: this.walletInfo.address as `0x${string}`,
        network: this.walletInfo.network as 'base-sepolia' | 'base',
      });
      return balances;
    } catch (error) {
      this.logger.error('Failed to get token balances:', error);
      throw error;
    }
  }

  /**
   * Monitor incoming transactions (placeholder)
   * This will be implemented in the monitor service
   */
  async getIncomingTransactions(): Promise<TransactionInfo[]> {
    // TODO: Implement transaction monitoring
    this.logger.warn('getIncomingTransactions not yet implemented');
    return [];
  }
}

