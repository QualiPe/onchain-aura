import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DonationService } from '../donation/donation.service';
import type { Donation } from '../donation/donation.types';

@Injectable()
export class MonitorService implements OnModuleInit {
  private readonly logger = new Logger(MonitorService.name);
  private isMonitoring = false;

  constructor(private donationService: DonationService) {}

  onModuleInit() {
    this.logger.log('Transaction monitor initialized');
    // Start monitoring immediately on startup
    this.checkForDonations();
  }

  /**
   * Check for new donations every 30 seconds
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkForDonations() {
    if (this.isMonitoring) {
      return; // Skip if already checking
    }

    this.isMonitoring = true;
    try {
      const newDonations = await this.donationService.monitorNewDonations();
      
      if (newDonations.length > 0) {
        this.logger.log(`Found ${newDonations.length} new donation(s)`);
        // TODO: Trigger pipeline for each new donation
        for (const donation of newDonations) {
          this.logger.log(
            `Processing donation ${donation.id}: ${donation.valueEth} ETH${donation.message ? ` with message: "${donation.message.substring(0, 50)}..."` : ''}`,
          );
          // Pipeline will be triggered here once implemented
        }
      }
    } catch (error) {
      this.logger.error('Error monitoring donations:', error);
    } finally {
      this.isMonitoring = false;
    }
  }

  /**
   * Manually trigger donation check
   */
  async triggerCheck(): Promise<Donation[]> {
    return await this.donationService.monitorNewDonations();
  }
}

