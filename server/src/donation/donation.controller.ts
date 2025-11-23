import { Controller, Get, Param, Post } from '@nestjs/common';
import { DonationService } from './donation.service';
import type { Donation } from './donation.types';

@Controller('donations')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Get()
  getAllDonations(): Donation[] {
    return this.donationService.getAllDonations();
  }

  @Get('with-messages')
  getDonationsWithMessages(): Donation[] {
    return this.donationService.getDonationsWithMessages();
  }

  @Get(':id')
  getDonationById(@Param('id') id: string): Donation | undefined {
    return this.donationService.getDonationById(id);
  }

  @Post('monitor')
  async monitorDonations(): Promise<{ donations: Donation[]; count: number }> {
    const donations = await this.donationService.monitorNewDonations();
    return {
      donations,
      count: donations.length,
    };
  }
}

