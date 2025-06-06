import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const Mailjet = require('node-mailjet');

@Injectable()
export class EmailService {
  private mailjet: any;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.mailjet = new Mailjet({
      apiKey: this.configService.get<string>('MAILJET_API_KEY'),
      apiSecret: this.configService.get<string>('MAILJET_API_SECRET'),
    });
  }

  async sendAccessRequestEmail(to: string, vaultOwnerEmail: string) {
    await this.mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: this.configService.get<string>('FROM_EMAIL'),
            Name: this.configService.get<string>('FROM_NAME'),
          },
          To: [{ Email: to }],
          Subject: 'Emergency Access Request - VaultBox',
          HTMLPart: `
            <h2>Emergency Access Request</h2>
            <p>You have requested emergency access to ${vaultOwnerEmail}'s vault.</p>
            <p>You will be notified when access is granted.</p>
            <p>This usually happens when:</p>
            <ul>
              <li>The vault owner has been inactive for the specified period</li>
              <li>The vault owner manually grants you access</li>
            </ul>
            <p>You can check the status of your request at any time by visiting the emergency access page.</p>
          `,
        },
      ],
    });
  }

  async sendAccessGrantedEmail(to: string, vaultOwnerEmail: string) {
    await this.mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: this.configService.get<string>('FROM_EMAIL'),
            Name: this.configService.get<string>('FROM_NAME'),
          },
          To: [{ Email: to }],
          Subject: 'Emergency Access Granted - VaultBox',
          HTMLPart: `
            <h2>Emergency Access Granted</h2>
            <p>You have been granted emergency access to ${vaultOwnerEmail}'s vault.</p>
            <p>You can now view shared entries by visiting the emergency access page.</p>
            <p>Please handle this access responsibly.</p>
          `,
        },
      ],
    });
  }

  async sendInactivityWarningEmail(to: string, trustedContactEmail: string) {
    await this.mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: this.configService.get<string>('FROM_EMAIL'),
            Name: this.configService.get<string>('FROM_NAME'),
          },
          To: [{ Email: to }],
          Subject: 'Inactivity Warning - VaultBox',
          HTMLPart: `
            <h2>Inactivity Warning</h2>
            <p>Your vault has been inactive for an extended period.</p>
            <p>If you remain inactive, your trusted contact (${trustedContactEmail}) may be granted emergency access.</p>
            <p>To prevent this, simply log in to your vault.</p>
          `,
        },
      ],
    });
  }

  async sendAccessStatusUpdateEmail(to: string, vaultOwnerEmail: string, daysRemaining: number) {
    await this.mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: this.configService.get<string>('FROM_EMAIL'),
            Name: this.configService.get<string>('FROM_NAME'),
          },
          To: [{ Email: to }],
          Subject: 'Emergency Access Request Status Update - VaultBox',
          HTMLPart: `
            <h2>Access Request Status Update</h2>
            <p>Your emergency access request for ${vaultOwnerEmail}'s vault is still pending.</p>
            <p>Access will be automatically granted in ${daysRemaining} days if no action is taken.</p>
            <p>You can check your request status anytime by visiting the emergency access page.</p>
          `,
        },
      ],
    });
  }

  async sendTrustedContactAddedEmail(to: string) {
    await this.mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: this.configService.get<string>('FROM_EMAIL'),
            Name: this.configService.get<string>('FROM_NAME'),
          },
          To: [{ Email: to }],
          Subject: 'You Have Been Added as a Trusted Contact - VaultBox',
          HTMLPart: `
            <h2>Trusted Contact Access</h2>
            <p>You have been added as a trusted contact in VaultBox.</p>
            <p>This means:</p>
            <ul>
              <li>You can request emergency access to the vault if needed</li>
              <li>Access will be granted after a specified period of inactivity</li>
              <li>You will be notified when access is granted</li>
            </ul>
            <p>You can manage emergency access anytime by visiting VaultBox.</p>
          `,
        },
      ],
    });
  }
} 