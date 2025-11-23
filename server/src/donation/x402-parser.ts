import { decodeAbiParameters, parseAbiParameters } from 'viem';
import type { X402Message } from './donation.types';

/**
 * X402 Protocol Parser
 * X402 is a protocol for sending messages with payments
 * Format: First 4 bytes are function selector, followed by encoded message
 */
export class X402Parser {
  /**
   * Parse X402 message from transaction data
   * X402 typically uses a function selector like `sendMessage(string)` or similar
   */
  static parseTransactionData(data: string): X402Message | null {
    if (!data || data === '0x' || data.length < 10) {
      return null;
    }

    try {
      // X402 might use a standard function selector
      // Common patterns: sendMessage(string), message(string), etc.
      // For now, we'll try to decode as a string parameter
      
      // Try common X402 function selectors
      const x402Selectors = [
        '0x9d96e2df', // sendMessage(string) - example selector
        '0x8be0079c', // message(string) - example selector
      ];

      const functionSelector = data.slice(0, 10);
      
      // If it matches a known selector, decode the message
      if (x402Selectors.includes(functionSelector)) {
        const encodedData = data.slice(10);
        try {
          const decoded = decodeAbiParameters(
            parseAbiParameters('string'),
            `0x${encodedData}` as `0x${string}`
          );
          return {
            protocol: 'x402',
            message: decoded[0] as string,
            version: '1.0',
          };
        } catch (error) {
          // If decoding fails, try to extract as raw string from hex
          return this.extractStringFromHex(encodedData);
        }
      }

      // Try to extract string directly from hex data
      return this.extractStringFromHex(data.slice(10));
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract string from hex-encoded data
   */
  private static extractStringFromHex(hexData: string): X402Message | null {
    try {
      // Remove 0x prefix if present
      const cleanHex = hexData.startsWith('0x') ? hexData.slice(2) : hexData;
      
      // Try to decode as UTF-8 string
      const bytes = Buffer.from(cleanHex, 'hex');
      const text = bytes.toString('utf-8').replace(/\0/g, '').trim();
      
      // Check if it looks like a valid message (not just random bytes)
      if (text.length > 0 && text.length < 1000 && /^[\x20-\x7E\s]*$/.test(text)) {
        return {
          protocol: 'x402',
          message: text,
        };
      }
    } catch (error) {
      // Not a valid string
    }
    
    return null;
  }

  /**
   * Check if transaction data might contain an X402 message
   */
  static isX402Transaction(data: string): boolean {
    if (!data || data === '0x' || data.length < 10) {
      return false;
    }
    
    // X402 transactions typically have data beyond just a function call
    // Check if data length suggests a message payload
    return data.length > 74; // Minimum for function selector + some data
  }
}

