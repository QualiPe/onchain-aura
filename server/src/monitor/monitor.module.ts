import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { DonationModule } from '../donation/donation.module';

@Module({
  imports: [DonationModule],
  providers: [MonitorService],
  exports: [MonitorService],
})
export class MonitorModule {}

