import { Controller, Get } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('address')
  getAddress(): { address: string } {
    return {
      address: this.walletService.getWalletAddress(),
    };
  }

  @Get('info')
  getInfo() {
    return this.walletService.getWalletInfo();
  }

  @Get('balance')
  async getBalance(): Promise<{ balance: string }> {
    const balance = await this.walletService.getBalance();
    return { balance };
  }

  @Get('tokens')
  async getTokenBalances(): Promise<any> {
    const balances = await this.walletService.getTokenBalances();
    return balances;
  }
}

