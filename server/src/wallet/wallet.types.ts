export interface WalletConfig {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret: string;
}

export interface WalletInfo {
  address: string;
  accountId: string;
  network: string;
}

export interface TransactionInfo {
  hash: string;
  from: string;
  to: string;
  value: string;
  data?: string;
  timestamp: number;
}

