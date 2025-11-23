import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DonationService } from './donation.service';
import { DonationController } from './donation.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [ConfigModule, WalletModule],
  providers: [DonationService],
  controllers: [DonationController],
  exports: [DonationService],
})
export class DonationModule {}

