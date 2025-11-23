import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletService } from '../wallet/wallet.service';
import { createPublicClient, http, formatEther, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { X402Parser } from './x402-parser';
import type { Donation, DonationMessage } from './donation.types';

@Injectable()
export class DonationService {
  private readonly logger = new Logger(DonationService.name);
  private publicClient: ReturnType<typeof createPublicClient>;
  private donations: Map<string, Donation> = new Map();
  private lastCheckedBlock: bigint = 0n;

  constructor(
    private configService: ConfigService,
    private walletService: WalletService,
  ) {
    const rpcUrl = this.configService.get<string>('RPC_URL_BASE');
    
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    }) as any; // Type assertion to avoid complex viem type issues
  }

  /**
   * Extract message from transaction data
   */
  private extractMessage(transactionData: string): DonationMessage | null {
    if (!transactionData || transactionData === '0x') {
      return null;
    }

    // Try X402 protocol first
    if (X402Parser.isX402Transaction(transactionData)) {
      const x402Message = X402Parser.parseTransactionData(transactionData);
      if (x402Message) {
        return {
          message: x402Message.message,
          source: 'x402',
        };
      }
    }

    // Try to extract string from transaction data
    try {
      const cleanHex = transactionData.startsWith('0x') ? transactionData.slice(2) : transactionData;
      const bytes = Buffer.from(cleanHex, 'hex');
      const text = bytes.toString('utf-8').replace(/\0/g, '').trim();
      
      if (text.length > 0 && text.length < 1000) {
        return {
          message: text,
          source: 'transaction-data',
        };
      }
    } catch (error) {
      // Not a valid string
    }

    return null;
  }

  /**
   * Calculate message weight based on donation amount and message content
   * Higher weight = more important/valuable
   */
  private calculateMessageWeight(valueEth: string, message?: string): number {
    const amount = parseFloat(valueEth);
    
    // Base weight from amount (logarithmic scale)
    let weight = Math.log10(amount + 0.000001) * 10; // +0.000001 to avoid log(0)
    
    // Boost weight if message exists
    if (message && message.trim().length > 0) {
      const messageLength = message.trim().length;
      // Longer messages get slight boost, but not too much
      weight += Math.min(messageLength / 100, 5);
    }
    
    // Minimum weight of 1
    return Math.max(weight, 1);
  }

  /**
   * Process a transaction and create a donation record if it's to our wallet
   */
  async processTransaction(transactionHash: string): Promise<Donation | null> {
    try {
      const walletAddress = this.walletService.getWalletAddress().toLowerCase();
      
      // Get transaction details
      const tx = await this.publicClient.getTransaction({ hash: transactionHash as `0x${string}` });
      
      // Check if transaction is to our wallet
      if (tx.to?.toLowerCase() !== walletAddress) {
        return null;
      }

      // Check if we already processed this transaction
      if (this.donations.has(transactionHash)) {
        return this.donations.get(transactionHash)!;
      }

      // Get transaction receipt for block number
      const receipt = await this.publicClient.getTransactionReceipt({ hash: transactionHash as `0x${string}` });
      
      // Extract message from transaction data
      const messageData = this.extractMessage(tx.input);
      const valueEth = formatEther(tx.value);
      
      // Create donation record
      const donation: Donation = {
        id: transactionHash,
        transactionHash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        valueEth,
        message: messageData?.message,
        messageWeight: this.calculateMessageWeight(valueEth, messageData?.message),
        timestamp: Date.now(),
        blockNumber: Number(receipt.blockNumber),
        data: tx.input !== '0x' ? tx.input : undefined,
      };

      this.donations.set(transactionHash, donation);
      this.logger.log(
        `New donation received: ${valueEth} ETH from ${tx.from}${messageData ? ` with message: "${messageData.message.substring(0, 50)}..."` : ''}`,
      );

      return donation;
    } catch (error) {
      this.logger.error(`Failed to process transaction ${transactionHash}:`, error);
      return null;
    }
  }

  /**
   * Monitor new transactions by polling recent blocks
   */
  async monitorNewDonations(): Promise<Donation[]> {
    try {
      const walletAddress = this.walletService.getWalletAddress().toLowerCase();
      const currentBlock = await this.publicClient.getBlockNumber();
      
      // Start from last checked block, or current block - 10 if first run
      const startBlock = this.lastCheckedBlock > 0n ? this.lastCheckedBlock + 1n : currentBlock - 10n;
      
      if (startBlock > currentBlock) {
        return [];
      }

      this.logger.debug(`Checking blocks ${startBlock} to ${currentBlock} for donations`);
      
      const newDonations: Donation[] = [];

      // Check each block in range
      for (let blockNum = startBlock; blockNum <= currentBlock; blockNum++) {
        try {
          const block = await this.publicClient.getBlock({ blockNumber: blockNum, includeTransactions: true });
          
          // Check each transaction in the block
          for (const tx of block.transactions) {
            if (typeof tx === 'object' && tx.to?.toLowerCase() === walletAddress && tx.value > 0n) {
              const donation = await this.processTransaction(tx.hash);
              if (donation) {
                newDonations.push(donation);
              }
            }
          }
        } catch (error) {
          this.logger.warn(`Failed to check block ${blockNum}:`, error);
        }
      }

      this.lastCheckedBlock = currentBlock;
      
      if (newDonations.length > 0) {
        this.logger.log(`Found ${newDonations.length} new donation(s)`);
      }

      return newDonations;
    } catch (error) {
      this.logger.error('Failed to monitor donations:', error);
      return [];
    }
  }

  /**
   * Get all donations
   */
  getAllDonations(): Donation[] {
    return Array.from(this.donations.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get donation by ID
   */
  getDonationById(id: string): Donation | undefined {
    return this.donations.get(id);
  }

  /**
   * Get donations with messages
   */
  getDonationsWithMessages(): Donation[] {
    return this.getAllDonations().filter((d) => d.message && d.message.trim().length > 0);
  }
}

