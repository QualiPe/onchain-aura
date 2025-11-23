export interface Donation {
  id: string;
  transactionHash: string;
  from: string;
  to: string;
  value: string; // in wei
  valueEth: string; // in ETH
  message?: string;
  messageWeight: number; // Calculated weight based on amount and message
  timestamp: number;
  blockNumber?: number;
  data?: string; // Transaction input data
}

export interface DonationMessage {
  message: string;
  source: 'x402' | 'transaction-data' | 'event-log';
}

export interface X402Message {
  protocol: 'x402';
  message: string;
  version?: string;
}

